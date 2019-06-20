package Controllers;

import org.glassfish.jersey.media.multipart.FormDataParam;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;

@Path("tile/")
public class Tile {

    private static final int MAX_X = 9;
    private static final int MAX_Y = 7;

    static class TileModel {            // The model class for tiles, with co-ordinate and image path.
        int x;
        int y;
        String path;
    }

    private static final ArrayList<TileModel> tiles = new ArrayList<>();        // The list of tiles.

    /*-------------------------------------------------------
    The API request handler for /tile/list
    Prepares a JSON list of all the tiles to send to the client.
    ------------------------------------------------------*/
    @GET
    @Path("list")
    @Produces(MediaType.APPLICATION_JSON)
    public String listTiles() {

        JSONArray tileList = new JSONArray();

        for (TileModel t : tiles) {

            JSONObject o = new JSONObject();
            o.put("x", t.x);
            o.put("y", t.y);
            o.put("path", t.path);
            tileList.add(o);
        }

        return tileList.toString();
    }

    /*-------------------------------------------------------
    The API request handler for /tile/new
    Creates a new tile object (this occurs after uploading a new image).
    ------------------------------------------------------*/
    @POST
    @Path("new")
    @Produces(MediaType.APPLICATION_JSON)
    public String newTile(@FormDataParam("x") int x, @FormDataParam("y") int y, @FormDataParam("path") String image) {

        if (x >= MAX_X) x = MAX_X - 1;          // Check the tile is inside the allowed region.
        if (x < 0) x = 0;
        if (y >= MAX_Y) y = MAX_Y - 1;
        if (y < 0) y = 0;

        boolean alreadyExists = false;

        for (TileModel t: tiles) {
            if (t.x == x && t.y == y) {
                synchronized (tiles) {
                    t.path = image;             // If there is already a tile at the requested location, overwrite it.
                }
                alreadyExists = true;
                break;
            }
        }

        if (!alreadyExists) {           // If there isn't a tile at the current location...

            TileModel t = new TileModel();
            t.x = x;                        // ... create a new one ...
            t.y = y;
            t.path = image;

            synchronized (tiles) {
                tiles.add(t);               // ... and add it to the list.
            }

        }

        return "{\"status\": \"OK\"}";
    }

}
