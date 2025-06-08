export interface TwitterCredentials {
  accessToken: string
  refreshToken: string
  expiresAt: number // epoch timestamp
  twitterUserId: string
}

export interface TweetResponse {
  data: {
    id: string
    text: string
  }
}
