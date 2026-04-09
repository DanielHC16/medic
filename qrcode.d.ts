declare module "qrcode" {
  type ToDataUrlOptions = {
    color?: {
      dark?: string;
      light?: string;
    };
    margin?: number;
    width?: number;
  };

  const QRCode: {
    toDataURL(text: string, options?: ToDataUrlOptions): Promise<string>;
  };

  export default QRCode;
}
