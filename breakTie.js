const typeComp = new Map([
    ['string.undefined', 'local'],
    ['string.string', 'tie'],
    ['boolean.undefined', 'local'],
]);
export function breakTie(localVal, remoteVal) {
    const localType = typeof localVal;
    const remoteType = typeof remoteVal;
    const sameType = localType === remoteType;
    let winner = typeComp.get(`${localType}.${remoteType}`);
    let val = localVal;
    if (winner === 'tie') {
        switch (localType) {
            case 'string':
                if (localVal.length > remoteVal.length) {
                    winner = 'local';
                    val = localVal;
                }
                else {
                    winner = 'remote';
                    val = remoteVal;
                }
        }
    }
    return {
        winner,
        val
    };
}
