/** Lỗi nghiệp vụ. `message` là câu tiếng Việt hiện cho người dùng. */
export class ZError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
