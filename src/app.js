// import { createServer} from "https";
import { createServer } from "http";
import { app } from "./appsub.js";

const httpServer = createServer(app);

const port =  process.env.PORT || 3050;

httpServer.listen(port, async () => {
  console.log(`Server listening on ${port}`);
});