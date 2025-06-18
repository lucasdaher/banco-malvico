import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

async function verifyToken(token: string): Promise<any> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get("Authorization");
  const token = tokenCookie?.value;

  const isPublicPage = ["/signin", "/"].includes(pathname);

  if (!token && !isPublicPage) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (token) {
    const payload = await verifyToken(token);
    console.log("Conteúdo do Payload recebido pelo Middleware:", payload);

    if (!payload && !isPublicPage) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("Authorization");
      return response;
    }

    if (payload) {
      if (!payload.tipo_usuario) {
        // Se o token não tem o campo 'tipo_usuario', ele é considerado inválido/antigo.
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("Authorization");
        return response;
      }

      const userType = (payload.tipo_usuario as string).toUpperCase();

      if (isPublicPage) {
        const dashboardUrl =
          userType === "CLIENTE"
            ? "/cliente/dashboard"
            : "/funcionario/dashboard";
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      }

      if (userType === "CLIENTE" && pathname.startsWith("/funcionario")) {
        return NextResponse.redirect(
          new URL("/cliente/dashboard", request.url)
        );
      }

      if (userType === "FUNCIONARIO" && pathname.startsWith("/cliente")) {
        return NextResponse.redirect(
          new URL("/funcionario/dashboard", request.url)
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
