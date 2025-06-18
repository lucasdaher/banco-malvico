import * as jose from "jose";

export async function verifyToken(token: string): Promise<any> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}
