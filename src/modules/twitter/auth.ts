import { config } from "@/config"
import { generateCodeChallenge, generateCodeVerifier } from "@twitter/utils"

export async function getTwitterAuthUrl(): Promise<{
  url: string
  verifier: string
}> {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.twitterClientId,
    redirect_uri: config.twitterRedirectUri,
    scope: config.twitterScopes.join(" "),
    state: Math.random().toString(36).substring(2), // Optional: used to prevent CSRF
    code_challenge: challenge,
    code_challenge_method: "S256"
  })

  const url = `${config.twitterAuthUrl}?${params.toString()}`

  return { url, verifier }
}
