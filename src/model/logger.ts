export default interface Logger {
  error(arg0: string): Promise<void>;
  info(message: string): Promise<void>;
}
