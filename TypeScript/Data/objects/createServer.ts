import HTTPServer from "./HTTPServer.js";
export class createServer {
  private readonly HTTPServer = new HTTPServer();
  public readonly httpsInstance = this.HTTPServer.HTTPS();
  public readonly httpInstance = this.HTTPServer.HTTP();
  public HTTPS(options?: {
    port: number;
    hostname: string;
    log: {
      serviceName: string;
      logPath: string;
    };
    callback: () => void;
  }) {
    this.httpsInstance.listen(
      options?.port || 443,
      options?.hostname,
      options?.callback
    );
  }
  public HTTP(options?: {
    port: number;
    hostname: string;
    log: {
      serviceName: string;
      logPath: string;
    };
    callback: () => void;
  }) {
    this.httpInstance.listen(
      options?.port || 80,
      options?.hostname,
      options?.callback
    );
  }
  public FTP() {}
  public SFTP() {}
  public TLS() {}
  public SOCKET() {}
  public WEBSOCKET() {}
  public MC() {}
}
export default createServer;
