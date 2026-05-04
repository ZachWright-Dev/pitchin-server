export interface UserImageRequest {
    user_id: string
}

export interface UserImageResponse {
    oauth_image: string | null // Image URL of the user gmail
    image: string | null
    imageType: string | null
}
