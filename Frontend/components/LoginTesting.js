import getGoogleOAuthURL from "../utils/getGoogleUrl";
import getLinkedinOAuthURL from "../utils/getLinkedinOAuthURL";

import React from "react";

function LoginTesting() {
  return (
    <>
      <div
        style={{
          height: "80vh",
          width: "90vw",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <a
          href={getGoogleOAuthURL()}
          style={{ cursor: "pointer", margin: "2rem" }}
        >
          Login with Google
        </a>
        <a
          href={`https://github.com/login/oauth/authorize?client_id=${
            process.env.NEXT_PUBLIC_GITHUB_OAUTH_CLIENT_ID
          }&redirect_uri=${
            process.env.NEXT_PUBLIC_GITHUB_OAUTH_REDIRECT_URI
          }?path=${"/"}&scope=user:email`}
          style={{ cursor: "pointer", margin: "2rem" }}
        >
          Login with Github
        </a>
        {/* <a
          href={getLinkedinOAuthURL()}
          style={{ cursor: "pointer", margin: "2rem" }}
        >
          Login with Linkedin
        </a> */}
      </div>
    </>
  );
}

export default LoginTesting;
