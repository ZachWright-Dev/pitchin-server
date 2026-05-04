export interface DashboardRequest {
    user_id: string
}

export interface DashboardResponse {
    summary: {
        overall_balance: number
        amount_owed: number
        amount_owe: number
        num_groups_owed: number
    }
    people: PersonBalance[]
    groups: GroupBalance[]
}

export interface PersonBalance {
    id: string
    name: string
    balance: number
}

export interface GroupBalance {
    id: string
    name: string
    balance: number
}