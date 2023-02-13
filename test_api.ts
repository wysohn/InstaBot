import IAccount from "@model/account";
import * as dotenv from "dotenv";
import InstagramAPI from "./src/driver/api/instagram_api";

dotenv.config();

let insta = new InstagramAPI(true);
let account: IAccount = {
  principal: { loginId: process.env.USER_ID },
  password: process.env.PASSWORD,
};
insta.login(account).catch(console.error);
