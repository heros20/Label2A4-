import "server-only"
import { mkdir, readFile, stat, writeFile } from "fs/promises"
import path from "path"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { isSupabaseAdminConfigured } from "@/lib/supabase/config"

export const DESKTOP_APP_FILE_NAME = "Label2A4-Setup.exe"
export const DESKTOP_APP_DOWNLOAD_PATH = "/api/desktop-app/download"
export const DESKTOP_APP_BUCKET = "desktop-app"
export const DESKTOP_APP_OBJECT_PATH = `setup/${DESKTOP_APP_FILE_NAME}`

const desktopAppConfigPath = "config/release.json"
const desktopAppDirectory = path.join(process.cwd(), "public", "downloads")
const desktopAppPath = path.join(desktopAppDirectory, DESKTOP_APP_FILE_NAME)
const localDesktopAppConfigPath = path.join(desktopAppDirectory, "release.json")

export interface DesktopAppFileInfo {
  downloadUrl: string | null
  exists: boolean
  fileName: string
  sizeBytes: number
  source: "github-release" | "storage-file" | "missing"
  updatedAt: Date | null
}

export interface DesktopAppDownload {
  bytes: Buffer | Blob
  sizeBytes: number
}

interface DesktopAppReleaseConfig {
  downloadUrl: string
  fileName: string
  updatedAt: string
}

interface SupabaseStorageFileMetadata {
  size?: number
}

interface SupabaseStorageFileObject {
  created_at?: string
  metadata?: SupabaseStorageFileMetadata | null
  name: string
  updated_at?: string
}

function getFileNameFromUrl(downloadUrl: string) {
  try {
    const url = new URL(downloadUrl)
    const lastSegment = url.pathname.split("/").filter(Boolean).pop()
    return lastSegment ? decodeURIComponent(lastSegment) : DESKTOP_APP_FILE_NAME
  } catch {
    return DESKTOP_APP_FILE_NAME
  }
}

export function validateDesktopAppReleaseUrl(downloadUrl: string) {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(downloadUrl.trim())
  } catch {
    throw new Error("URL GitHub Release invalide.")
  }

  if (parsedUrl.protocol !== "https:") {
    throw new Error("L'URL doit commencer par https://.")
  }

  if (parsedUrl.hostname !== "github.com") {
    throw new Error("Utilisez une URL d'asset GitHub Release en github.com.")
  }

  if (!parsedUrl.pathname.includes("/releases/download/") && !parsedUrl.pathname.includes("/releases/latest/download/")) {
    throw new Error("Collez l'URL directe de l'asset depuis une GitHub Release.")
  }

  return parsedUrl.toString()
}

async function ensureDesktopAppBucket() {
  const supabase = getSupabaseAdminClient()
  const { error: getBucketError } = await supabase.storage.getBucket(DESKTOP_APP_BUCKET)

  if (!getBucketError) {
    return
  }

  const { error: createBucketError } = await supabase.storage.createBucket(DESKTOP_APP_BUCKET, {
    public: false,
  })

  if (createBucketError) {
    throw new Error(createBucketError.message)
  }
}

async function getLocalReleaseConfig(): Promise<DesktopAppReleaseConfig | null> {
  try {
    return JSON.parse(await readFile(localDesktopAppConfigPath, "utf-8")) as DesktopAppReleaseConfig
  } catch {
    return null
  }
}

async function getSupabaseReleaseConfig(): Promise<DesktopAppReleaseConfig | null> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.storage.from(DESKTOP_APP_BUCKET).download(desktopAppConfigPath)

  if (error || !data) {
    return getLocalReleaseConfig()
  }

  try {
    return JSON.parse(await data.text()) as DesktopAppReleaseConfig
  } catch {
    return null
  }
}

async function getDesktopAppReleaseConfig() {
  if (process.env.DESKTOP_APP_DOWNLOAD_URL) {
    const downloadUrl = validateDesktopAppReleaseUrl(process.env.DESKTOP_APP_DOWNLOAD_URL)

    return {
      downloadUrl,
      fileName: getFileNameFromUrl(downloadUrl),
      updatedAt: new Date(0).toISOString(),
    }
  }

  if (isSupabaseAdminConfigured()) {
    return getSupabaseReleaseConfig()
  }

  return getLocalReleaseConfig()
}

async function getLocalDesktopAppFileInfo(): Promise<DesktopAppFileInfo> {
  try {
    const fileStat = await stat(desktopAppPath)

    return {
      downloadUrl: null,
      exists: fileStat.isFile(),
      fileName: DESKTOP_APP_FILE_NAME,
      sizeBytes: fileStat.size,
      source: "storage-file",
      updatedAt: fileStat.mtime,
    }
  } catch {
    return {
      downloadUrl: null,
      exists: false,
      fileName: DESKTOP_APP_FILE_NAME,
      sizeBytes: 0,
      source: "missing",
      updatedAt: null,
    }
  }
}

async function getSupabaseDesktopAppFileInfo(): Promise<DesktopAppFileInfo> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.storage.from(DESKTOP_APP_BUCKET).list("setup", {
    limit: 20,
    search: DESKTOP_APP_FILE_NAME,
  })

  if (error) {
    return getLocalDesktopAppFileInfo()
  }

  const file = data.find((item) => item.name === DESKTOP_APP_FILE_NAME) as SupabaseStorageFileObject | undefined

  if (!file) {
    return getLocalDesktopAppFileInfo()
  }

  return {
    downloadUrl: null,
    exists: true,
    fileName: DESKTOP_APP_FILE_NAME,
    sizeBytes: file.metadata?.size ?? 0,
    source: "storage-file",
    updatedAt: file.updated_at ? new Date(file.updated_at) : file.created_at ? new Date(file.created_at) : null,
  }
}

export async function getDesktopAppFileInfo(): Promise<DesktopAppFileInfo> {
  const releaseConfig = await getDesktopAppReleaseConfig()

  if (releaseConfig?.downloadUrl) {
    return {
      downloadUrl: releaseConfig.downloadUrl,
      exists: true,
      fileName: releaseConfig.fileName,
      sizeBytes: 0,
      source: "github-release",
      updatedAt: releaseConfig.updatedAt ? new Date(releaseConfig.updatedAt) : null,
    }
  }

  if (isSupabaseAdminConfigured()) {
    return getSupabaseDesktopAppFileInfo()
  }

  return getLocalDesktopAppFileInfo()
}

export async function getDesktopAppDownloadUrl() {
  const releaseConfig = await getDesktopAppReleaseConfig()
  return releaseConfig?.downloadUrl ?? null
}

export async function saveDesktopAppReleaseUrl(downloadUrl: string) {
  const normalizedDownloadUrl = validateDesktopAppReleaseUrl(downloadUrl)
  const config: DesktopAppReleaseConfig = {
    downloadUrl: normalizedDownloadUrl,
    fileName: getFileNameFromUrl(normalizedDownloadUrl),
    updatedAt: new Date().toISOString(),
  }

  if (isSupabaseAdminConfigured()) {
    await ensureDesktopAppBucket()

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.storage.from(DESKTOP_APP_BUCKET).upload(desktopAppConfigPath, JSON.stringify(config), {
      cacheControl: "60",
      contentType: "application/json",
      upsert: true,
    })

    if (error) {
      throw new Error(error.message)
    }

    return getDesktopAppFileInfo()
  }

  await mkdir(desktopAppDirectory, { recursive: true })
  await writeFile(localDesktopAppConfigPath, JSON.stringify(config, null, 2))

  return getDesktopAppFileInfo()
}

export async function getDesktopAppDownload(): Promise<DesktopAppDownload | null> {
  if (isSupabaseAdminConfigured()) {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase.storage.from(DESKTOP_APP_BUCKET).download(DESKTOP_APP_OBJECT_PATH)

    if (!error && data) {
      return {
        bytes: data,
        sizeBytes: data.size,
      }
    }
  }

  try {
    const [fileStat, bytes] = await Promise.all([stat(desktopAppPath), readFile(desktopAppPath)])

    return {
      bytes,
      sizeBytes: fileStat.size,
    }
  } catch {
    return null
  }
}
