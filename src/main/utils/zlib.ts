import { promisify } from "util";
import zlib from 'zlib'
export default class ZlibUtil {

    public static gunzip = promisify(zlib.gunzip)
    public static gzip = promisify(zlib.gzip)

    public static async decompressGzipBuffer(compressedBuffer: Buffer<ArrayBuffer>, encoding: BufferEncoding = 'utf-8') {
        const decompressedBuffer = await ZlibUtil.gunzip(compressedBuffer);
        const result = decompressedBuffer.toString(encoding);
        return result;
    }

    public static async compressGzipString(inputString:string):Promise<Buffer<ArrayBuffer>>{
        const compressedBuffer = await ZlibUtil.gzip(inputString);
        return compressedBuffer
    }   
}