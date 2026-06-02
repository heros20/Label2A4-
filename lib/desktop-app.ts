import "server-only"
import { mkdir, stat, writeFile } from "fs/promises"
import { readFile } from "fs/promises"
import path from "path"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { isSupabaseAdminConfigured } from "@/lib/supabase/config"

export const DESKTOP_APP_FILE_NAME = "Label2A4-Setup.exe"
export const DESKTOP_APP_DOWNLOAD_PATH = "/api/desktop-app/download"
export const DESKTOP_APP_MAX_SIZE_BYTES = 120 * 1024 * 1024

export const DESKTOP_APP_BUCKET = "desktop-app"
export const DESKTOP_APP_OBJECT_PATH = `setup/${DESKTOP_APP_FILE_NAME}`
const desktopAppDirectory = path.join(process.cwd(), "public", "downloads")
const desktopAppPath = path.join(desktopAppDirectory, DESKTOP_APP_FILE_NAME)

export interface DesktopAppFileInfo {
  exists: boolean
  fileName: string
  sizeBytes: number
  updatedAt: Date | null
}

export interface DesktopAppDownload {
  bytes: Buffer | Blob
  sizeBytes: number
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

export function validateDesktopAppInstallerMetadata(fileName: string, sizeBytes: number) {
  if (!fileName.toLowerCase().endsWith(".exe")) {
    throw new Error("Le fichier doit etre un executable .exe.")
  }

  if (sizeBytes <= 0) {
    throw new Error("Le fichier est vide.")
  }

  if (sizeBytes > DESKTOP_APP_MAX_SIZE_BYTES) {
    throw new Error("Le fichier est trop volumineux pour cet upload.")
  }
}

async function getLocalDesktopAppFileInfo(): Promise<DesktopAppFileInfo> {
  try {
    const fileStat = await stat(desktopAppPath)

    return {
      exists: fileStat.isFile(),
      fileName: DESKTOP_APP_FILE_NAME,
      sizeBytes: fileStat.size,
      updatedAt: fileStat.mtime,
    }
  } catch {
    return {
      exists: false,
      fileName: DESKTOP_APP_FILE_NAME,
      sizeBytes: 0,
      updatedAt: null,
    }
  }
}

async function ensureDesktopAppBucket() {
  const supabase = getSupabaseAdminClient()
  const { error: getBucketError } = await supabase.storage.getBucket(DESKTOP_APP_BUCKET)

  if (!getBucketError) {
    return
  }

  const { error: createBucketError } = await supabase.storage.createBucket(DESKTOP_APP_BUCKET, {
    fileSizeLimit: DESKTOP_APP_MAX_SIZE_BYTES,
    public: false,
  })

  if (createBucketError) {
    throw new Error(createBucketError.message)
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
    exists: true,
    fileName: DESKTOP_APP_FILE_NAME,
    sizeBytes: file.metadata?.size ?? 0,
    updatedAt: file.updated_at ? new Date(file.updated_at) : file.created_at ? new Date(file.created_at) : null,
  }
}

export async function getDesktopAppFileInfo(): Promise<DesktopAppFileInfo> {
  if (isSupabaseAdminConfigured()) {
    return getSupabaseDesktopAppFileInfo()
  }

  return getLocalDesktopAppFileInfo()
}

export async function saveDesktopAppInstaller(file: File) {
  validateDesktopAppInstallerMetadata(file.name, file.size)

  const bytes = Buffer.from(await file.arrayBuffer())

  if (isSupabaseAdminConfigured()) {
    await ensureDesktopAppBucket()

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.storage.from(DESKTOP_APP_BUCKET).upload(DESKTOP_APP_OBJECT_PATH, bytes, {
      cacheControl: "60",
      contentType: "application/vnd.microsoft.portable-executable",
      upsert: true,
    })

    if (error) {
      throw new Error(error.message)
    }

    return getSupabaseDesktopAppFileInfo()
  }

  await mkdir(desktopAppDirectory, { recursive: true })
  await writeFile(desktopAppPath, bytes)

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

export async function createDesktopAppSignedUpload(fileName: string, sizeBytes: number) {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Configuration Supabase Storage requise pour uploader ce fichier.")
  }

  validateDesktopAppInstallerMetadata(fileName, sizeBytes)
  await ensureDesktopAppBucket()

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.storage
    .from(DESKTOP_APP_BUCKET)
    .createSignedUploadUrl(DESKTOP_APP_OBJECT_PATH, { upsert: true })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
