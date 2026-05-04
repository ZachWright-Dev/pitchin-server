export interface UserImageRequest {
    user_id: string
}

export interface UserImageResponse {
    oauth_image: string | null // Image URL of the user gmail
    image: string | null
    imageType: string | null
}

export interface GroupOverviewRequest{
    user_id: string
}

export interface GroupOverviewResponse {
    groups: Group[]
}

export interface Group {
    id: string
    name: string
    balance: number
    members: GroupMember[]
}

export interface GroupMember {
    id: string
    name: string
}
