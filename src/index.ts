import App from "@driver/app";

import * as dotenv from "dotenv";
dotenv.config();

const app = new App(
  {
    info: async (message) => console.log(message),
    error: async (message) => console.error(message),
  },
  !!(process.argv.length > 2 && process.argv[2] === "true")
);

app.main().catch(console.error);
