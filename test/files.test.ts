import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFiles } from './fixtures/directus-sdk/request/read-files.data'

const MOCK_BASE_URL = 'https://cms.example.com'

const FILE_1 = readFiles.admin[0]!
const FILE_2 = readFiles.admin[1]!

let mockRequest: ReturnType<typeof vi.fn>
let capturedFormData: FormData | null

beforeEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()

  mockRequest = vi.fn()
  capturedFormData = null

  vi.doMock('../src/runtime/composables/directus', () => ({
    useDirectus: vi.fn(() => ({ request: mockRequest })),
    useDirectusUrl: vi.fn((path = '') => `${MOCK_BASE_URL}/${path}`),
  }))

  vi.doMock('@directus/sdk', () => ({
    uploadFiles: vi.fn((fd: FormData) => {
      capturedFormData = fd
      return {}
    }),
  }))
})

describe('getDirectusFileUrl', () => {
  it('builds a URL from a string file ID', async () => {
    const { getDirectusFileUrl } = await import('../src/runtime/composables/files')
    expect(getDirectusFileUrl(FILE_1.id)).toContain(`assets/${FILE_1.id}`)
  })

  it('accepts a DirectusFile object', async () => {
    const { getDirectusFileUrl } = await import('../src/runtime/composables/files')
    const file: DirectusFile = { id: FILE_1.id }
    expect(getDirectusFileUrl(file)).toContain(`assets/${FILE_1.id}`)
  })

  it('produces a clean URL with no query string when no options are passed', async () => {
    const { getDirectusFileUrl } = await import('../src/runtime/composables/files')
    expect(getDirectusFileUrl(FILE_1.id)).not.toContain('?')
  })

  it('appends width and height matching the fixture image dimensions', async () => {
    const { getDirectusFileUrl } = await import('../src/runtime/composables/files')
    const url = getDirectusFileUrl(FILE_1.id, { width: FILE_1.width!, height: FILE_1.height! })
    expect(url).toContain(`width=${FILE_1.width}`)
    expect(url).toContain(`height=${FILE_1.height}`)
  })

  it('appends quality', async () => {
    const { getDirectusFileUrl } = await import('../src/runtime/composables/files')
    expect(getDirectusFileUrl(FILE_1.id, { quality: 75 })).toContain('quality=75')
  })

  it('appends fit and format', async () => {
    const { getDirectusFileUrl } = await import('../src/runtime/composables/files')
    const url = getDirectusFileUrl(FILE_1.id, { fit: 'cover', format: 'webp' })
    expect(url).toContain('fit=cover')
    expect(url).toContain('format=webp')
  })

  it('appends download=true', async () => {
    const { getDirectusFileUrl } = await import('../src/runtime/composables/files')
    expect(getDirectusFileUrl(FILE_1.id, { download: true })).toContain('download=true')
  })

  it('does not append download when false', async () => {
    const { getDirectusFileUrl } = await import('../src/runtime/composables/files')
    expect(getDirectusFileUrl(FILE_1.id, { download: false })).not.toContain('download')
  })

  it('appends withoutEnlargement=true', async () => {
    const { getDirectusFileUrl } = await import('../src/runtime/composables/files')
    expect(getDirectusFileUrl(FILE_1.id, { withoutEnlargement: true })).toContain('withoutEnlargement=true')
  })

  it('appends a named transformation key', async () => {
    const { getDirectusFileUrl } = await import('../src/runtime/composables/files')
    expect(getDirectusFileUrl(FILE_1.id, { key: 'system-small-cover' })).toContain('key=system-small-cover')
  })

  it('embeds filename in the URL path', async () => {
    const { getDirectusFileUrl } = await import('../src/runtime/composables/files')
    const url = getDirectusFileUrl(FILE_1.id, { filename: FILE_1.filename_download })
    expect(url).toContain(`assets/${FILE_1.id}/${FILE_1.filename_download}`)
  })
})

describe('uploadDirectusFiles', () => {
  it('appends each file under the "file" key so multiple files are not overwritten', async () => {
    const { uploadDirectusFiles } = await import('../src/runtime/composables/files')
    const file1 = new File(['png-bytes'], FILE_1.filename_download, { type: FILE_1.type })
    const file2 = new File(['jpeg-bytes'], FILE_2.filename_download, { type: FILE_2.type })

    await uploadDirectusFiles([{ file: file1 }, { file: file2 }])

    expect(capturedFormData!.getAll('file')).toHaveLength(2)
    expect(capturedFormData!.getAll('file')[0]).toBe(file1)
    expect(capturedFormData!.getAll('file')[1]).toBe(file2)
  })

  it('includes metadata fields alongside the file', async () => {
    const { uploadDirectusFiles } = await import('../src/runtime/composables/files')
    const file = new File(['png-bytes'], FILE_1.filename_download, { type: FILE_1.type })

    await uploadDirectusFiles([{ file, data: { title: FILE_1.title } }])

    expect(capturedFormData!.get('title')).toBe(FILE_1.title)
    expect(capturedFormData!.getAll('file')).toHaveLength(1)
  })

  it('calls directus.request with the built FormData command', async () => {
    const { uploadDirectusFiles } = await import('../src/runtime/composables/files')
    await uploadDirectusFiles([{ file: new File(['x'], FILE_1.filename_download) }])
    expect(mockRequest).toHaveBeenCalledOnce()
  })
})

describe('uploadDirectusFile', () => {
  it('returns the first element when the result is an array', async () => {
    mockRequest.mockResolvedValue([FILE_1])

    const { uploadDirectusFile } = await import('../src/runtime/composables/files')
    const result = await uploadDirectusFile({ file: new File(['x'], FILE_1.filename_download) })

    expect(result).toStrictEqual(FILE_1)
  })

  it('returns the result directly when it is not an array', async () => {
    mockRequest.mockResolvedValue(FILE_2)

    const { uploadDirectusFile } = await import('../src/runtime/composables/files')
    const result = await uploadDirectusFile({ file: new File(['x'], FILE_2.filename_download) })

    expect(result).toStrictEqual(FILE_2)
  })

  it('delegates to uploadDirectusFiles with a single-item array', async () => {
    mockRequest.mockResolvedValue([FILE_1])

    const { uploadDirectusFile } = await import('../src/runtime/composables/files')
    const file = new File(['png-bytes'], FILE_1.filename_download, { type: FILE_1.type })
    await uploadDirectusFile({ file })

    expect(capturedFormData!.getAll('file')).toHaveLength(1)
    expect(capturedFormData!.getAll('file')[0]).toBe(file)
  })
})
