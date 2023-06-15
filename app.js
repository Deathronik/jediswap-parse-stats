import * as fs from "node:fs"
let wallets = JSON.parse(fs.readFileSync('wallets.json'))
const contestNftRank = async () => {
    const response = await fetch("https://api.jediswap.xyz/graphql", {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,ru-UA;q=0.8,ru;q=0.7,uk;q=0.6",
            "content-type": "application/json",
            "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "Referer": "https://info.jediswap.xyz/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": "{\"operationName\":\"lpcontestnftrank\",\"variables\":{},\"query\":\"query lpcontestnftrank {\\n  lpContestNftRank {\\n    L1P1Start\\n    L1P1End\\n    L1P2Start\\n    L1P2End\\n    L1P3Start\\n    L1P3End\\n    L1P4Start\\n    L1P4End\\n    L1P5Start\\n    L1P5End\\n    __typename\\n  }\\n}\\n\"}",
        "method": "POST"
    })

    let json = await response.json()
    return json.data.lpContestNftRank
}

let NftRanks = await contestNftRank()
const eligibleForNftHelper = (rank) => {
    if (NftRanks.L1P1Start <= rank && NftRanks.L1P1End >= rank)
        return 1
    else if (NftRanks.L1P2Start <= rank && NftRanks.L1P2End >= rank)
        return 2
    else if (NftRanks.L1P3Start <= rank && NftRanks.L1P3End >= rank)
        return 3
    else if (NftRanks.L1P4Start <= rank && NftRanks.L1P4End >= rank)
        return 4
    else if (NftRanks.L1P5Start <= rank && NftRanks.L1P5End >= rank)
        return 5
    else
        return 0
}
const getStatsOfWallets = async (wallets) => {
    let results = [];

    for(let i = 0; i < wallets.length; i++) {
        let score
        let rank

        try {
            const scoreResponse = await fetch("https://api.jediswap.xyz/graphql", {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US,en;q=0.9,ru-UA;q=0.8,ru;q=0.7,uk;q=0.6",
                    "content-type": "application/json",
                    "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                    "Referer": "https://info.jediswap.xyz/",
                    "Referrer-Policy": "strict-origin-when-cross-origin"
                },
                "body": `{\"operationName\":\"lpContestSnapshots\",\"variables\":{\"user\":\"${wallets[i]}\",\"skip\":0},\"query\":\"query lpContestSnapshots($user: String!, $skip: Int!) {\\n  lpContestBlocks(first: 1000, skip: $skip, where: {user: $user}, orderBy: \\\"block\\\", orderByDirection: \\\"desc\\\") {\\n    block\\n    contestValue\\n    timestamp\\n    isEligible\\n    __typename\\n  }\\n}\\n\"}`,
                "method": "POST"
            })

            const scoreJson = await scoreResponse.json()
            score = scoreJson.data.lpContestBlocks[0].contestValue
        } catch (e) {
            console.log(`${wallets[i]} ----- This wallet don't provide LP on JediSwap`)
        }

        try {
            const rankResponse = await fetch("https://api.jediswap.xyz/graphql", {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-US,en;q=0.9,ru-UA;q=0.8,ru;q=0.7,uk;q=0.6",
                    "content-type": "application/json",
                    "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                    "Referer": "https://info.jediswap.xyz/",
                    "Referrer-Policy": "strict-origin-when-cross-origin"
                },
                "body": `{\"operationName\":\"lpContestPercentile\",\"variables\":{\"user\":\"${wallets[i]}\"},\"query\":\"query lpContestPercentile($user: String!) {\\n  lpContestPercentile(where: {user: $user}) {\\n    percentileRank\\n    rank\\n    __typename\\n  }\\n}\\n\"}`,
                "method": "POST"
            })

            let rankJson = await rankResponse.json();
            rank = rankJson.data.lpContestPercentile.rank

            let eligibleForNft = eligibleForNftHelper(rank);
            results.push({wallet: wallets[i], score, rank, eligibleForNft: eligibleForNft !== 0 ? `L1P${eligibleForNft}` : 'Not Eligible'})
            console.log(`${wallets[i]} ----- Successfully get stats of wallet`)
        } catch (e) {
            results.push({wallet: wallets[i], score: 0, rank: 0, eligibleForNft: 0, error: "This wallet don't provide LP on JediSwap"})
        }

    }

    fs.writeFileSync(`results-${Date.now()}.json`, JSON.stringify(results));
}

await getStatsOfWallets(wallets);
console.log("--------------------------------\nResults saved to result file in app directory...")