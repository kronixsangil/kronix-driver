//app\api\driver\[...path]\route.ts
import { NextRequest } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API || "http://localhost:3004";

function buildTargetUrl(req: NextRequest, pathParts: string[]) {
  const path = pathParts.join("/");
  const url = new URL(req.url);
  const target = new URL(`${API_BASE.replace(/\/$/, "")}/${path}`);

  url.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  return target.toString();
}

function buildProxyHeaders(sourceHeaders: Headers) {
  const headers = new Headers(sourceHeaders);

  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("transfer-encoding");
  headers.delete("connection");
  headers.delete("keep-alive");
  headers.delete("proxy-authenticate");
  headers.delete("proxy-authorization");
  headers.delete("te");
  headers.delete("trailer");
  headers.delete("upgrade");

  return headers;
}

async function proxy(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const targetUrl = buildTargetUrl(req, path || []);

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.set("x-ct-app", "driver");

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const res = await fetch(targetUrl, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const responseHeaders = buildProxyHeaders(res.headers);
  const isStream = String(res.headers.get('content-type') || '').includes('text/event-stream');
  if (isStream) {
    responseHeaders.set('Cache-Control','no-cache, no-transform');
    responseHeaders.set('X-Accel-Buffering','no');
    return new Response(res.body,{status:res.status,headers:responseHeaders});
  }
  const responseBody = await res.arrayBuffer();

  responseHeaders.delete("set-cookie");
  const setCookies=(res.headers as any).getSetCookie?.() ?? (res.headers.get("set-cookie")||"").split(/,(?=\s*[^;,]+=)/g).filter(Boolean);
  for(const value of setCookies)responseHeaders.append("set-cookie",value);
  return new Response(responseBody, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(req, context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(req, context);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(req, context);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(req, context);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(req, context);
}

export async function OPTIONS(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(req, context);
}