package com.greentogo.services;
import com.backendless.Backendless;
import com.backendless.servercode.BackendlessService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
@BackendlessService
public class LocationUpdate
{
    // in this method the work is mainly done with the 'ZXing' library
    public byte[] generateQRCode( String data, int width, int height ) throws IOException, WriterException
    {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode( data, BarcodeFormat.QR_CODE, width, height );
        byte[] png;
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream())
        {
            MatrixToImageWriter.writeToStream( bitMatrix, "PNG", baos );
            png = baos.toByteArray();
        }
        return png;
    }
    public String[] generateLocation( String name, String service, String code, int boxes) throws WriterException, IOException
    {
        // generate qr code with our method
        byte[] png = this.generateQRCode( name, 100, 100 );
        // generate random uuid as file name and save it using Backendless File service
        String uuid = UUID.randomUUID().toString();
        String path = Backendless.Files.saveFile( "Locations", uuid + ".png", png );
        // create record in database where we save original data, and a link to generated file
        Map<String, Object> record = new HashMap<>();
        record.put( "name", name );
        record.put( "service", service);
        record.put( "qr_code", path );
        record.put( "code", code);
        record.put( "inventory", boxes);
        Map<String, Object> result = Backendless.Data.of( "Locations" ).save( record );
        // return response with objectId and file path
        return new String[] { (String) result.get( "objectId" ), path };
    }
}