function getLinkedinOAuthURL() {
  let rootUrl = "https://www.linkedin.com/oauth/v2/authorization";
  const options = {
    redirect_uri: process.env.NEXT_PUBLIC_LINKEDIN_OAUTH_REDIRECT_URI,
    client_id: process.env.NEXT_PUBLIC_LINKEDIN_OAUTH_CLIENT_ID,
    response_type: "code",
    scope: ["r_liteprofile", "r_emailaddress"].join(" "),
  };

  console.log({ options });
  const queryString = new URLSearchParams(options);
  console.log("queryString: ", queryString.toString());
  return `${rootUrl}?${queryString.toString()}`;
}

export default getLinkedinOAuthURL;
