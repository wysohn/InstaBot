import IAccount from "@model/account";
import Cookie from "@model/cookie";
import CookieRepository from "@driver/repository/cookie_repository";
import InstagramAPI, {
  FacebookLogin,
  InstagramLogin,
} from "@driver/api/instagram_api";

import * as dotenv from "dotenv";
import Logger from "@model/logger";
import { ILoginProvider } from "@model/provider";
dotenv.config();

const logger: Logger = {
  info: async (message: string) => console.log(message),
  error: async (message: string) => console.error(message),
};
const insta = new InstagramAPI(logger, true, [
  // (req) => req.resourceType() === "image",
  // (req) => req.resourceType() === "media",
]);
const account: IAccount = {
  principal: { loginId: process.env.USER_ID },
  password: process.env.PASSWORD,
  providerType: "facebook",
};
const cookie = new Cookie(new CookieRepository());

const provider: ILoginProvider = new FacebookLogin(account);
(async () => {
  const session = await insta.initSession();
  await session.updateCookie(await cookie.loadCookie(account));
  if (!(await session.isValid())) {
    console.log("new session login");
    await session.login(provider);
  }
  await cookie.saveCookie(account, await session.getCookie());

  /// tests here

  // await insta
  //   .unfollowUser(session, "https://www.instagram.com/championsleague/")
  //   .then((result) => console.log(`unfollowed? ${result}`))
  //   .catch(console.error);

  // await insta
  //   .followUser(session, "https://www.instagram.com/championsleague/")
  //   .then((result) => console.log(`followed? ${result}`))
  //   .catch(console.error);

  // await insta
  //   .isFollowed(session, "https://www.instagram.com/championsleague/")
  //   .then((result) => console.log(`already followed? ${result}`))
  //   .catch(console.error);

  // const posts = await insta.getPosts(session, "championsleague");
  // for (const post of posts) {
  //   console.log(await post.getPostTime(session));
  //   console.log(await post.getOwner(session));
  //   console.log(post);
  // }

  const posts = await insta.getPostsByUser(
    session,
    "https://www.instagram.com/championsleague/"
  );
  for (const post of posts) {
    console.log(await post.getPostTime(session));
    console.log(post);
  }

  // await insta
  //   .getPostTime(session, "https://www.instagram.com/p/CoswEoQrtzG/")
  //   .then((result) => console.log(result))
  //   .catch(console.error);

  // await insta
  //   .getPostOwner(session, "https://www.instagram.com/p/CosutcMIUCo/")
  //   .then((result) => console.log(result))
  //   .catch(console.error);

  // await insta
  //   .unlikePost(session, "https://www.instagram.com/p/CosutcMIUCo/")
  //   .then((result) => console.log(`already unliked? ${result}`))
  //   .catch(console.error);

  // await insta
  //   .likePost(session, "https://www.instagram.com/p/CosutcMIUCo/")
  //   .then((result) => console.log(`already liked? ${result}`))
  //   .catch(console.error);

  // insta
  //   .writeCommentToPost(
  //     session,
  //     "https://www.instagram.com/p/CoswEoQrtzG/",
  //     "😍😍😍😍 Fascinating 🔥🔥"
  //   )
  //   .catch(console.error);
})().catch(console.error);
