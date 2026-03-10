import { defineTransformer } from "orval";

type SchemaObject = {
  properties?: Record<string, unknown>;
};

type ParameterObject = {
  name?: string;
  in?: string;
  required?: boolean;
  schema?: { $ref?: string } | Record<string, unknown>;
};

type OpenApiLike = Record<string, unknown> & {
  paths?: Record<string, Record<string, { parameters?: unknown[] }>>;
  components?: {
    parameters?: Record<string, unknown>;
    schemas?: Record<string, unknown>;
  };
};

function resolveRef<T>(ref: string, spec: OpenApiLike): T | undefined {
  const parts = ref.split("/");
  const [, section, collection, key] = parts;

  if (section !== "components" || !collection || !key) {
    return undefined;
  }

  if (collection === "parameters") {
    return spec.components?.parameters?.[key] as T | undefined;
  }

  if (collection === "schemas") {
    return spec.components?.schemas?.[key] as T | undefined;
  }

  return undefined;
}

function resolveParameter(
  parameter: unknown,
  spec: OpenApiLike,
): ParameterObject | undefined {
  if (!parameter || typeof parameter !== "object") {
    return undefined;
  }

  const withRef = parameter as { $ref?: string };
  if (withRef.$ref) {
    return resolveRef<ParameterObject>(withRef.$ref, spec);
  }

  return parameter as ParameterObject;
}

function resolveSchema(
  schema: ParameterObject["schema"],
  spec: OpenApiLike,
): SchemaObject | undefined {
  if (!schema || typeof schema !== "object") {
    return undefined;
  }

  const withRef = schema as { $ref?: string };
  if (withRef.$ref) {
    return resolveRef<SchemaObject>(withRef.$ref, spec);
  }

  return schema as SchemaObject;
}

function getPropertySchema(
  schema: SchemaObject | undefined,
  key: string,
  fallback: Record<string, unknown>,
): Record<string, unknown> {
  const value = schema?.properties?.[key];
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return fallback;
}

export default defineTransformer((openApi) => {
  const spec = structuredClone(openApi) as OpenApiLike;
  const getVideos = spec.paths?.["/videos"]?.get;

  if (!getVideos?.parameters?.length) {
    return spec as typeof openApi;
  }

  const resolvedParameters = getVideos.parameters
    .map((parameter) => ({
      original: parameter,
      resolved: resolveParameter(parameter, spec),
    }))
    .filter((item) => item.resolved);

  const pageableEntry = resolvedParameters.find(
    ({ resolved }) =>
      resolved?.in === "query" && resolved?.name?.toLowerCase() === "pageable",
  );

  if (!pageableEntry?.resolved) {
    return spec as typeof openApi;
  }

  const pageableSchema = resolveSchema(pageableEntry.resolved.schema, spec);

  const pageSchema = getPropertySchema(pageableSchema, "page", {
    type: "integer",
    minimum: 0,
  });
  const sizeSchema = getPropertySchema(pageableSchema, "size", {
    type: "integer",
    minimum: 1,
  });
  const sortSchema = getPropertySchema(pageableSchema, "sort", {
    type: "array",
    items: { type: "string" },
  });

  getVideos.parameters = getVideos.parameters.filter(
    (parameter) => parameter !== pageableEntry.original,
  );

  getVideos.parameters.unshift(
    {
      in: "query",
      name: "sort",
      required: false,
      schema: sortSchema,
    },
    {
      in: "query",
      name: "size",
      required: false,
      schema: sizeSchema,
    },
    {
      in: "query",
      name: "page",
      required: false,
      schema: pageSchema,
    },
  );

  return spec as typeof openApi;
});
