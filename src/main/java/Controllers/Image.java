package Controllers;

import org.glassfish.jersey.media.multipart.FormDataParam;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

import javax.imageio.ImageIO;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.UUID;

@Path("image/")
public class Image {

    public static final int TILE_SIZE = 128;

    /*-------------------------------------------------------
    The API request handler for /image/list
    Sends a list of all the image files on the server.
    ------------------------------------------------------*/
    @GET
    @Path("list")
    @Produces(MediaType.APPLICATION_JSON)
    public String listImages() {

        File folder = new File("resources/client/img");
        File[] files = folder.listFiles();                              // Get a list of all the files in the folder

        JSONArray responses = new JSONArray();
        for (File file : files) {                                       // Build a JSON list of the file paths...
            JSONObject image = new JSONObject();
            image.put("path", "/client/img/" + file.getName());
            responses.add(image);
        }

        return responses.toString();                                    // ...send it to the client

    }

    /*-------------------------------------------------------
    The API request handler for /image/upload
    Allows the client to upload an image file.
    It will be resized to TILE_SIZE wide and high.
    ------------------------------------------------------*/
    @POST
    @Path("upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public String uploadImage(@FormDataParam("file") InputStream fileInputStream) {

        try {

            String id = UUID.randomUUID().toString();       // Create a random file id (avoids filename clashes)

            int read;
            byte[] bytes = new byte[1024];
            OutputStream outputStream = new FileOutputStream(new File("resources/" + id + "_temp"));
            while ((read = fileInputStream.read(bytes)) != -1) {
                outputStream.write(bytes, 0, read);                     // Upload the file to a temporary location...
            }
            outputStream.flush();
            outputStream.close();

            File tempFile = new File("resources/" + id + "_temp");      // Load the temp file into memory
            BufferedImage originalImage = ImageIO.read(tempFile);

            BufferedImage resizedImage = new BufferedImage(TILE_SIZE, TILE_SIZE, originalImage.getType() == 0? BufferedImage.TYPE_INT_ARGB : originalImage.getType());
            Graphics2D g = resizedImage.createGraphics();
            g.drawImage(originalImage, 0, 0, TILE_SIZE, TILE_SIZE, null);       // Draw a resized version to a buffer
            g.dispose();

            String newPath = "/client/img/" + id + ".png";                         // Save the resized image buffer to the correct location
            ImageIO.write(resizedImage, "png", new File("resources" + newPath));

            if (!tempFile.delete()) {                                              // Delete the temporary file
                throw new IOException("Failed to delete temp file.");
            }

            return "{\"status\":\"OK\", \"path\":\"" + newPath + "\"}";         // Tell the client the new path (based on the random id)

        } catch (IOException ioe) {

            System.out.println("Image upload error: " + ioe.getMessage());
            return "{\"error\":\"" + ioe.getMessage() + "\"}";

        }

    }

}
