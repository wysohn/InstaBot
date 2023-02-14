import IAccount from "@model/account";
import Cookie from "@model/cookie";
import CookieRepository from "@driver/repository/cookie_repository";
import InstagramAPI from "@driver/api/instagram_api";

import * as dotenv from "dotenv";
dotenv.config();

const insta = new InstagramAPI(true);
const account: IAccount = {
  principal: { loginId: process.env.USER_ID },
  password: process.env.PASSWORD,
};
const cookie = new Cookie(new CookieRepository());

(async () => {
  const session = await insta.initSession(account);
  await session.updateCookie(await cookie.loadCookie(account));
  if (!(await session.isValid())) {
    console.log("new session login");
    await session.login();
  }
  await cookie.saveCookie(account, await session.getCookie());

  const posts = await insta.getPosts(session, "championsleague");
  for (const post of posts) {
    console.log(await post.getPostTime(session));
    console.log(post);
  }

  // await insta
  //   .likePost(session, "https://www.instagram.com/p/CohlTg_pNcB/")
  //   .then((result) => console.log(`already liked? ${result}`))
  //   .catch(console.error);

  // await insta
  //   .followUser(session, "https://www.instagram.com/championsleague/")
  //   .then((result) => console.log(`already followed? ${result}`))
  //   .catch(console.error);

  // insta
  //   .writeCommentToPost(
  //     session,
  //     "https://www.instagram.com/p/CoShMtyomL9/",
  //     "😍😍😍😍"
  //   )
  //   .catch(console.error);
})().catch(console.error);
