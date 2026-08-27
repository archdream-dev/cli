export class AppError extends Error {
  constructor(
    message: string,
    public code = 1,
  ) {
    super(message);
    this.name = "AppError";
  }
}
