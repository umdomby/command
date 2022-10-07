const pairs = Array.from({length: clientsNumber})
    .reduce((acc, next, index, arr) => {
        if (index % 2 === 0) {
            acc.push(arr.slice(index, index + 2));
        }

        return acc;
    }, []);