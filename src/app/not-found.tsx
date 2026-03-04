import Link from "next/link";

export default async function NotFound() {
  return (
    <div className="mt-52 flex flex-col items-center font-semibold">
      <h1>404 - Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      <Link href="/">Go to Home</Link>
    </div>
  );
}
