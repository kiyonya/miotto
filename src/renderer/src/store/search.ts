import { defineStore } from "pinia";
interface SearchStore {
    searchHistory: string[]
}
const useSearchStore = defineStore('search', {
    state: (): SearchStore => ({
        searchHistory: []
    }),
    persist: true,
    actions: {
        pushSearchHistory(keyword: string) {
            const index = this.searchHistory.indexOf(keyword)
            if (index > 0) {
                const m = this.searchHistory.splice(index, 1)
                m.unshift(keyword)
                this.searchHistory = m
            }
            else {
                this.searchHistory.unshift(keyword)
            }
        },
        removeSearchHistory(keyword: string) {
            this.searchHistory = this.searchHistory.filter(i => i !== keyword)
        },
        clearSearchHistory() {
            this.searchHistory = []
        }
    }
})
export { useSearchStore }