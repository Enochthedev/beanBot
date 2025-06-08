import { config } from "@/config"
import { TwitterCredentials, TweetResponse } from "./types"

export class TwitterEngine {
  constructor(private creds: TwitterCredentials) {}

  async postTweet(text: string): Promise<TweetResponse> {
    const res = await fetch(`${config.twitterApiBaseUrl}/tweets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.creds.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    })

    if (!res.ok) {
      throw new Error(`Twitter error: ${res.statusText}`)
    }

    return res.json()
  }

  // Additional methods:
  // - deleteTweet(tweetId)
  // - likeTweet(tweetId)
  // - retweet(tweetId)
}
