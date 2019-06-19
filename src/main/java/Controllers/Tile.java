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

    private static final int MAX_X = 10;
    private static final int MAX_Y = 10;

    static class TileModel {
        int x;
        int y;
        String path;
    }

    private static final ArrayList<TileModel> tiles = new ArrayList<>();

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

    @POST
    @Path("new")
    @Produces(MediaType.APPLICATION_JSON)
    public String newTile(@FormDataParam("x") int x, @FormDataParam("y") int y, @FormDataParam("path") String image) {

        if (x >= MAX_X) x = MAX_X - 1;
        if (x < 0) x = 0;
        if (y >= MAX_Y) y = MAX_Y - 1;
        if (y < 0) y = 0;

        TileModel t = new TileModel();
        t.x = x;
        t.y = y;
        t.path = image;

        synchronized (tiles) {
            tiles.add(t);
        }

        return "{\"status\": \"OK\"}";
    }



}
