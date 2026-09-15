(function exposeGrouping(root) {
  function chooseGroupSizes(playerCount, maxCourts) {
    let best = null;
    for (let courts = 1; courts <= maxCourts; courts += 1) {
      for (let fives = 0; fives <= courts; fives += 1) {
        const total = fives * 5 + (courts - fives) * 4;
        if (total > playerCount) continue;
        const candidate = {
          total,
          courts,
          fives,
          sizes: arrangeGroupSizes(courts, fives)
        };
        if (
          !best ||
          candidate.total > best.total ||
          (candidate.total === best.total && candidate.fives < best.fives) ||
          (candidate.total === best.total && candidate.fives === best.fives && candidate.courts > best.courts)
        ) {
          best = candidate;
        }
      }
    }
    return best ? best.sizes : [];
  }

  function arrangeGroupSizes(courts, fives) {
    const fours = courts - fives;
    if (fours <= 0) return Array(courts).fill(5);
    if (fives <= 0) return Array(courts).fill(4);
    if (fours === 1) {
      return [4, ...Array(courts - 1).fill(5)];
    }

    return [
      4,
      ...bestAlternatingSizes(courts - 2, fours - 2, fives, 4, 4),
      4
    ];
  }

  function bestAlternatingSizes(length, fours, fives, startSize, endSize) {
    const memo = new Map();

    function search(remainingFours, remainingFives, previous, runLength, maxRun) {
      const key = [remainingFours, remainingFives, previous, runLength, maxRun].join(":");
      if (memo.has(key)) return memo.get(key);

      if (remainingFours + remainingFives === 0) {
        const endRun = previous === endSize ? runLength + 1 : 1;
        return {
          sequence: [],
          alternations: previous === endSize ? 0 : 1,
          maxRun: Math.max(maxRun, endRun)
        };
      }

      const candidates = [];
      if (remainingFours > 0) {
        candidates.push(trySize(4, remainingFours - 1, remainingFives, previous, runLength, maxRun));
      }
      if (remainingFives > 0) {
        candidates.push(trySize(5, remainingFours, remainingFives - 1, previous, runLength, maxRun));
      }

      const best = candidates.sort(compareSizeArrangements)[0];
      memo.set(key, best);
      return best;
    }

    function trySize(size, remainingFours, remainingFives, previous, runLength, maxRun) {
      const nextRunLength = size === previous ? runLength + 1 : 1;
      const rest = search(
        remainingFours,
        remainingFives,
        size,
        nextRunLength,
        Math.max(maxRun, nextRunLength)
      );
      return {
        sequence: [size, ...rest.sequence],
        alternations: (size === previous ? 0 : 1) + rest.alternations,
        maxRun: rest.maxRun
      };
    }

    return search(fours, fives, startSize, 1, 1).sequence;
  }

  function compareSizeArrangements(left, right) {
    if (left.alternations !== right.alternations) {
      return right.alternations - left.alternations;
    }
    if (left.maxRun !== right.maxRun) {
      return left.maxRun - right.maxRun;
    }
    return left.sequence.join("").localeCompare(right.sequence.join(""));
  }

  function makeRound2Groups(round1Groups) {
    const groups = round1Groups.map((group) => [...group]);
    for (let index = 0; index < round1Groups.length - 1; index += 1) {
      const current = round1Groups[index];
      const next = round1Groups[index + 1];
      if (!current.length || !next.length) continue;
      groups[index][current.length - 1] = next[0];
      groups[index + 1][0] = current[current.length - 1];
    }
    return groups;
  }

  function movePlayerMaintainingGroupSizes(round1Groups, movingName, target) {
    const groups = round1Groups.map((group) => [...group]);
    const source = findPlayerInGroups(groups, movingName);
    if (!source) return null;

    const destination = groups[target.groupIndex];
    if (!destination) return null;

    let insertAt = destination.length;
    if (target.playerName) {
      insertAt = destination.indexOf(target.playerName);
      if (insertAt < 0 || target.playerName === movingName) return null;
      if (!target.before) insertAt += 1;
    }

    source.group.splice(source.playerIndex, 1);
    if (source.groupIndex === target.groupIndex && source.playerIndex < insertAt) {
      insertAt -= 1;
    }
    destination.splice(insertAt, 0, movingName);

    const lengths = rebalanceLengths(groups.map((group) => group.length));
    if (!lengths) return null;
    return splitByLengths(groups.flat(), lengths);
  }

  function rebalanceLengths(lengths) {
    const balanced = [...lengths];
    let guard = 0;
    while (!balanced.every((length) => length >= 4 && length <= 5) && guard < 100) {
      guard += 1;
      const underfullIndex = balanced.findIndex((length) => length < 4);
      if (underfullIndex >= 0) {
        const donorIndex = nearestIndex(balanced, underfullIndex, (length) => length > 4);
        if (donorIndex < 0) return null;
        shiftLengthUnit(balanced, donorIndex, underfullIndex);
        continue;
      }

      const overflowIndex = balanced.findIndex((length) => length > 5);
      if (overflowIndex >= 0) {
        const receiverIndex = nearestIndex(balanced, overflowIndex, (length) => length < 5);
        if (receiverIndex < 0) return null;
        shiftLengthUnit(balanced, overflowIndex, receiverIndex);
      }
    }
    return balanced.every((length) => length >= 4 && length <= 5) ? balanced : null;
  }

  function nearestIndex(items, fromIndex, predicate) {
    for (let distance = 1; distance < items.length; distance += 1) {
      const left = fromIndex - distance;
      const right = fromIndex + distance;
      if (left >= 0 && predicate(items[left], left)) return left;
      if (right < items.length && predicate(items[right], right)) return right;
    }
    return -1;
  }

  function shiftLengthUnit(lengths, fromIndex, toIndex) {
    if (fromIndex < toIndex) {
      for (let index = fromIndex; index < toIndex; index += 1) {
        lengths[index] -= 1;
        lengths[index + 1] += 1;
      }
    } else {
      for (let index = fromIndex; index > toIndex; index -= 1) {
        lengths[index] -= 1;
        lengths[index - 1] += 1;
      }
    }
  }

  function splitByLengths(players, lengths) {
    const groups = [];
    let offset = 0;
    lengths.forEach((length) => {
      groups.push(players.slice(offset, offset + length));
      offset += length;
    });
    return groups;
  }

  function findPlayerInGroups(groups, name) {
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
      const playerIndex = groups[groupIndex].indexOf(name);
      if (playerIndex >= 0) {
        return { groupIndex, playerIndex, group: groups[groupIndex] };
      }
    }
    return null;
  }

  const api = { chooseGroupSizes, makeRound2Groups, movePlayerMaintainingGroupSizes };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.Grouping = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
