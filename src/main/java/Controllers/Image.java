package Controllers;

import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
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

    @GET
    @Path("list")
    @Produces(MediaType.APPLICATION_JSON)
    public String listImages() {

        ArrayList<String> images = new ArrayList<>();

        File folder = new File("resources/client/img");

        File[] sortedFiles = folder.listFiles();

        if (sortedFiles != null) {

            Arrays.sort(sortedFiles, new Comparator<File>() {
                @Override
                public int compare(File file1, File file2) {
                    return file1.getName().compareTo(file2.getName());
                }
            });

            for (File file : sortedFiles) {
                if (file.isFile()) {
                    images.add(file.getName());
                }
            }
        }

        JSONArray responses = new JSONArray();

        for (String imageFilename : images) {

            JSONObject image = new JSONObject();
            image.put("path", "/client/img/" + imageFilename);
            responses.add(image);
        }

        return responses.toString();

    }


    @POST
    @Path("upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public String uploadImage(@FormDataParam("file") InputStream fileInputStream) {

        try {

            String id = UUID.randomUUID().toString();

            int read;
            byte[] bytes = new byte[1024];
            OutputStream outputStream = new FileOutputStream(new File("resources/client/img/" + id + "_temp"));
            while ((read = fileInputStream.read(bytes)) != -1) {
                outputStream.write(bytes, 0, read);
            }
            outputStream.flush();
            outputStream.close();

            File tempFile = new File("resources/client/img/" + id + "_temp");
            BufferedImage originalImage = ImageIO.read(tempFile);

            BufferedImage resizedImage = new BufferedImage(200, 200, originalImage.getType() == 0? BufferedImage.TYPE_INT_ARGB : originalImage.getType());
            Graphics2D g = resizedImage.createGraphics();
            g.drawImage(originalImage, 0, 0, 200, 200, null);
            g.dispose();

            String newPath = "/client/img/" + id + ".jpg";

            ImageIO.write(resizedImage, "jpg", new File("resources" + newPath));
            if (!tempFile.delete()) {
                throw new IOException("Failed to delete temp file.");
            }

            return "{\"status\":\"OK\", \"path\":\"" + newPath + "\"}";

        } catch (IOException ioe) {

            System.out.println("Image upload error: " + ioe.getMessage());
            return "{\"error\":\"" + ioe.getMessage() + "\"}";

        }

    }

}
