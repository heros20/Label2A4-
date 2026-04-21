import { createHash, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const ADMIN_SESSION_COOKIE = "label2a4_admin_session"

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function getExpectedSessionValue() {
  const token = process.env.ADMIN_DASHBOARD_TOKEN ?? ""
  return token ? hashValue(token) : ""
}

export function isAdminDashboardConfigured() {
  return Boolean(process.env.ADMIN_DASHBOARD_TOKEN?.trim())
}

export function isValidAdminToken(token: string) {
  const configured = process.env.ADMIN_DASHBOARD_TOKEN ?? ""
  if (!configured || !token) {
    return false
  }

  const left = Buffer.from(hashValue(token))
  const right = Buffer.from(hashValue(configured))
  return left.length === right.length && timingSafeEqual(left, right)
}

export function setAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, getExpectedSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  })
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies()
  const current = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  const expected = getExpectedSessionValue()

  if (!current || !expected) {
    return false
  }

  const left = Buffer.from(current)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function isAdminRequestAuthenticated(request: NextRequest) {
  const current = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const expected = getExpectedSessionValue()

  if (!current || !expected) {
    return false
  }

  const left = Buffer.from(current)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}
