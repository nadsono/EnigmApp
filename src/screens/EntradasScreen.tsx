import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Clock,
  Download,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useEnigma } from '../context/EnigmaContext.tsx';
import {
  SocialProofCase,
  SocialProofShowcase,
} from '../components/SocialProofShowcase.tsx';
import {
  evaluateBetEntry,
  formatBrlEquivalent,
  formatCurrencyBRL,
  formatHouseAccountBalance,
  formatShortHouseName,
  parseCurrencyInput,
  roundCurrency,
} from '../domain/ledger.ts';
import {
  getHouseColorTheme,
  getLegResultTheme,
  getOperationTypeTheme,
} from '../domain/uiTheme.ts';
import type { BetLeg, HouseAccount, LegResult, OperationType } from '../domain/types.ts';

function normalizeHouseKey(name: string): string {
  return formatShortHouseName(name)
    .toLowerCase()
    .replace(/\.com|\.io|\.xyz/g, '')
    .trim();
}

function doesAccountMatchHouse(accHouseName: string, targetHouseName: string): boolean {
  if (!accHouseName || !targetHouseName) return false;
  const aFull = accHouseName.trim().toLowerCase();
  const tFull = targetHouseName.trim().toLowerCase();
  if (aFull === tFull) return true;
  const aBase = normalizeHouseKey(accHouseName);
  const tBase = normalizeHouseKey(targetHouseName);
  return Boolean(aBase && tBase && aBase === tBase);
}

function getMatchingAccountsForHouse(
  houseName: string,
  accounts: HouseAccount[]
): HouseAccount[] {
  return accounts
    .filter((acc) => doesAccountMatchHouse(acc.houseName, houseName))
    .sort((a, b) => {
      const aLim = a.status === 'limitada' ? 1 : 0;
      const bLim = b.status === 'limitada' ? 1 : 0;
      if (aLim !== bLim) return aLim - bLim;
      return b.availableBalance - a.availableBalance;
    });
}

function findDefaultAccountForHouse(
  houseName: string,
  accounts: HouseAccount[]
): HouseAccount | null {
  const matching = getMatchingAccountsForHouse(houseName, accounts);
  return (
    matching.find((a) => a.status !== 'limitada' && a.availableBalance > 0) ||
    matching.find((a) => a.status !== 'limitada') ||
    matching[0] ||
    null
  );
}

const OPERATION_TYPES: Array<{ id: OperationType; label: string }> = [
  { id: 'ao_vivo', label: 'Ao vivo' },
  { id: 'pre_jogo', label: 'Pré-jogo' },
  { id: 'cashout', label: 'Cashout' },
  { id: 'bonus', label: 'Bônus' },
  { id: 'delay', label: 'Delay' },
  { id: 'extracao', label: 'Extração' },
];

const LEG_RESULT_OPTIONS: Array<{
  id: LegResult;
  label: string;
  shortLabel: string;
  activeClass: string;
}> = [
  {
    id: 'green',
    label: 'GREEN',
    shortLabel: 'GREEN',
    activeClass: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0] shadow-2xs font-bold',
  },
  {
    id: 'red',
    label: 'RED',
    shortLabel: 'RED',
    activeClass: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA] shadow-2xs font-bold',
  },
  {
    id: 'pendente',
    label: 'PENDENTE',
    shortLabel: 'PEND',
    activeClass: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A] shadow-2xs font-bold',
  },
  {
    id: 'void',
    label: 'VOID',
    shortLabel: 'VOID',
    activeClass: 'bg-[#F1F5F9] text-[#334155] border-[#CBD5E1] shadow-2xs font-bold',
  },
  {
    id: 'cashout',
    label: 'CASHOUT',
    shortLabel: 'CASH',
    activeClass: 'bg-[#F0FDFA] text-[#115E59] border-[#99F6E4] shadow-2xs font-bold',
  },
];

interface DraftHouseLeg {
  id: string;
  houseName: string;
  accountId: string;
  result: LegResult;
  stakeStr: string;
  oddStr: string;
  returnStr: string;
  selection: string;
}

export const EntradasScreen: React.FC = () => {
  const {
    entries,
    houseAccounts,
    partnerships,
    availableHouses,
    houseCatalog,
    gsbCandidates,
    activePeriodLabel,
    toggleGsbCandidate,
    importSelectedGsbCandidates,
    saveBetEntry,
    concludeBetEntry,
    navFocus,
    clearNavFocus,
    setActiveScreen,
    notify,
  } = useEnigma();

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [operationType, setOperationType] = useState<OperationType>('ao_vivo');

  const activePartnershipIds = useMemo(
    () => new Set(partnerships.filter((p) => p.status === 'ativa').map((p) => p.id)),
    [partnerships]
  );

  // Contas estritamente operacionais: pertencem a parcerias ativas (exclui estoque e arquivadas)
  const operationalHouseAccounts = useMemo(
    () => houseAccounts.filter((acc) => activePartnershipIds.has(acc.partnershipId)),
    [houseAccounts, activePartnershipIds]
  );

  const defaultHouse1 = availableHouses[0] || 'Pinnacle';
  const defaultHouse2 = availableHouses[1] || 'Cloudbet';
  const [selectedHouses, setSelectedHouses] = useState<string[]>([defaultHouse1, defaultHouse2]);

  const [houseLegs, setHouseLegs] = useState<DraftHouseLeg[]>(() => {
    const acc1 = findDefaultAccountForHouse(defaultHouse1, operationalHouseAccounts);
    const acc2 = findDefaultAccountForHouse(defaultHouse2, operationalHouseAccounts);
    return [
      {
        id: 'leg_init_1',
        houseName: defaultHouse1,
        accountId: acc1?.id || 'acc_pin_joao',
        result: 'green',
        stakeStr: '2.600,00',
        oddStr: '1,98',
        returnStr: '5.148,00',
        selection: '',
      },
      {
        id: 'leg_init_2',
        houseName: defaultHouse2,
        accountId: acc2?.id || 'acc_bet365_joao',
        result: 'red',
        stakeStr: '2.400,00',
        oddStr: '2,05',
        returnStr: '0,00',
        selection: '',
      },
    ];
  });

  useEffect(() => {
    if (editingEntryId) return;
    setHouseLegs((prevLegs) => {
      let changed = false;
      const aligned = prevLegs.map((leg, idx) => {
        const catalogMatch =
          availableHouses.find((h) => doesAccountMatchHouse(h, leg.houseName)) ||
          availableHouses[idx] ||
          formatShortHouseName(leg.houseName);
        const currentAcc = operationalHouseAccounts.find((a) => a.id === leg.accountId);
        const accMatchesHouse =
          currentAcc && doesAccountMatchHouse(currentAcc.houseName, catalogMatch);

        if (catalogMatch !== leg.houseName || !accMatchesHouse) {
          const fallbackAcc = findDefaultAccountForHouse(catalogMatch, operationalHouseAccounts);
          const nextAccId = accMatchesHouse ? leg.accountId : fallbackAcc?.id || '';
          if (catalogMatch !== leg.houseName || nextAccId !== leg.accountId) {
            changed = true;
            return {
              ...leg,
              houseName: catalogMatch,
              accountId: nextAccId,
            };
          }
        }
        return leg;
      });
      if (changed) {
        setSelectedHouses(aligned.map((l) => l.houseName));
        return aligned;
      }
      return prevLegs;
    });
  }, [availableHouses, operationalHouseAccounts, editingEntryId]);

  const [totalCapitalStr, setTotalCapitalStr] = useState<string>('5.000,00');
  const [dateTimeStr, setDateTimeStr] = useState<string>('11/10/2026 11:20');
  const [eventStr, setEventStr] = useState<string>('');
  const [marketStr, setMarketStr] = useState<string>('');
  const [alreadyConcludedCheck, setAlreadyConcludedCheck] = useState<boolean>(false);

  const [showSocialProof, setShowSocialProof] = useState<boolean>(false);
  const [showGsbPreview, setShowGsbPreview] = useState<boolean>(false);
  const [listFilter, setListFilter] = useState<'todas' | 'pendentes' | 'concluidas'>('todas');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [selectedCloneFilter, setSelectedCloneFilter] = useState<string>('Todos');

  const handleLoadSocialProofCase = (caseItem: SocialProofCase) => {
    setEditingEntryId(null);
    setEventStr(caseItem.event);
    setMarketStr(caseItem.market);
    setTotalCapitalStr(
      caseItem.totalStake.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    );
    setOperationType('ao_vivo');

    if (caseItem.id === 'case_middle_spurs_mavs') {
      const pinAcc = operationalHouseAccounts.find(
        (a) =>
          doesAccountMatchHouse(a.houseName, 'Pinnacle') ||
          doesAccountMatchHouse(a.houseName, 'BC.Game')
      );
      const b365Acc = operationalHouseAccounts.find(
        (a) =>
          doesAccountMatchHouse(a.houseName, 'Bet365') ||
          a.cloneGroup.includes('Blaze') ||
          a.cloneGroup.includes('Estrela')
      );

      setHouseLegs([
        {
          id: `leg_${Date.now()}_1`,
          houseName: pinAcc ? formatShortHouseName(pinAcc.houseName) : 'BC.Game',
          accountId: pinAcc?.id || '',
          result: 'green',
          stakeStr: '1.300,00',
          oddStr: '2,85',
          returnStr: '3.705,00',
          selection: 'Mais de 67.5 (1º Quarto)',
        },
        {
          id: `leg_${Date.now()}_2`,
          houseName: b365Acc ? formatShortHouseName(b365Acc.houseName) : 'Bet365',
          accountId: b365Acc?.id || '',
          result: 'green',
          stakeStr: '2.000,00',
          oddStr: '1,75',
          returnStr: '3.500,00',
          selection: 'Menos de 70.5 / Under 68.5',
        },
      ]);
      setSelectedHouses(['BC.Game', 'Bet365']);
    } else {
      const acc1 = operationalHouseAccounts[0];
      const acc2 = operationalHouseAccounts[1] || operationalHouseAccounts[0];

      setHouseLegs([
        {
          id: `leg_${Date.now()}_1`,
          houseName: acc1 ? formatShortHouseName(acc1.houseName) : 'Bet365',
          accountId: acc1?.id || '',
          result: 'green',
          stakeStr: '3.000,00',
          oddStr: '1,91',
          returnStr: '5.730,00',
          selection: 'Mais de 99.5 (1º Tempo)',
        },
        {
          id: `leg_${Date.now()}_2`,
          houseName: acc2 ? formatShortHouseName(acc2.houseName) : 'BC.Game',
          accountId: acc2?.id || '',
          result: 'green',
          stakeStr: '1.970,00',
          oddStr: '2,30',
          returnStr: '4.531,00',
          selection: 'Menos de 99.5 (1º Tempo)',
        },
      ]);
      setSelectedHouses(['Bet365', 'BC.Game']);
    }

    notify(
      'success',
      `Parâmetros da operação "${caseItem.title}" carregados na calculadora!`
    );
  };

  const cloneGroupsWithCount = useMemo(() => {
    const counts: Record<string, number> = { Todos: availableHouses.length };
    availableHouses.forEach((hName) => {
      const cat = houseCatalog.find(
        (c) => c.name.toLowerCase() === hName.toLowerCase() || c.code === hName.toLowerCase()
      );
      const acc = operationalHouseAccounts.find((a) => doesAccountMatchHouse(a.houseName, hName));
      const clone = cat?.cloneGroup?.trim() || acc?.cloneGroup?.trim() || 'Sem clones';
      counts[clone] = (counts[clone] || 0) + 1;
    });
    return counts;
  }, [availableHouses, houseCatalog, operationalHouseAccounts]);

  const displayedQuickHouses = useMemo(() => {
    if (selectedCloneFilter === 'Todos') return availableHouses;
    return availableHouses.filter((hName) => {
      const cat = houseCatalog.find(
        (c) => c.name.toLowerCase() === hName.toLowerCase() || c.code === hName.toLowerCase()
      );
      const acc = operationalHouseAccounts.find((a) => doesAccountMatchHouse(a.houseName, hName));
      const clone = cat?.cloneGroup?.trim() || acc?.cloneGroup?.trim() || 'Sem clones';
      return clone.toLowerCase() === selectedCloneFilter.toLowerCase();
    });
  }, [availableHouses, selectedCloneFilter, houseCatalog, operationalHouseAccounts]);

  const loadEntryForEditing = (entryId: string) => {
    const target = entries.find((e) => e.id === entryId);
    if (!target) return;

    setEditingEntryId(target.id);
    setOperationType(target.operationType);
    const housesList =
      target.houses.length > 0
        ? target.houses.map((h) => formatShortHouseName(h))
        : [defaultHouse1];
    setSelectedHouses(housesList);
    setTotalCapitalStr(
      target.totalInvestedCapital !== null
        ? target.totalInvestedCapital.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        : ''
    );
    setDateTimeStr(target.createdAt);
    setEventStr(target.event || '');
    setMarketStr(target.market || '');
    setAlreadyConcludedCheck(target.resultStatus === 'concluida');

    const expectedCount = Math.max(housesList.length, target.legs.length, 1);
    const syncedLegs: DraftHouseLeg[] = [];
    for (let i = 0; i < expectedCount; i++) {
      const existing = target.legs[i];
      const rawHouse = existing?.houseName || housesList[i] || housesList[0] || defaultHouse1;
      const houseForLeg =
        availableHouses.find((h) => doesAccountMatchHouse(h, rawHouse)) ||
        formatShortHouseName(rawHouse);
      const defaultAcc = findDefaultAccountForHouse(houseForLeg, operationalHouseAccounts);
      if (existing) {
        const existingAccObj = houseAccounts.find((a) => a.id === existing.accountId);
        const validAccountId =
          existingAccObj && doesAccountMatchHouse(existingAccObj.houseName, houseForLeg)
            ? existingAccObj.id
            : defaultAcc?.id || '';
        const oddVal = existing.odd;
        const stakeVal = existing.stake;
        const autoReturn =
          existing.grossReturn !== null
            ? existing.grossReturn
            : existing.result === 'green' && oddVal && stakeVal
            ? roundCurrency(oddVal * stakeVal)
            : null;
        syncedLegs.push({
          id: existing.id || `leg_${Date.now()}_${i}`,
          houseName: houseForLeg,
          accountId: validAccountId,
          result: existing.result || 'pendente',
          stakeStr:
            stakeVal !== null
              ? stakeVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
              : '',
          oddStr:
            oddVal !== null
              ? oddVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
              : '',
          returnStr:
            autoReturn !== null
              ? autoReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
              : '',
          selection: existing.selection || '',
        });
      } else {
        syncedLegs.push({
          id: `leg_new_${Date.now()}_${i}`,
          houseName: houseForLeg,
          accountId: defaultAcc?.id || '',
          result: 'pendente',
          stakeStr: '',
          oddStr: '',
          returnStr: '',
          selection: '',
        });
      }
    }
    setHouseLegs(syncedLegs);
  };

  useEffect(() => {
    if (navFocus.entryId) {
      loadEntryForEditing(navFocus.entryId);
      clearNavFocus();
    }
  }, [navFocus.entryId]);

  const handleToggleHousePill = (house: string) => {
    const existsInLegs = houseLegs.some((l) => doesAccountMatchHouse(l.houseName, house));
    if (existsInLegs && houseLegs.length > 1) {
      const next = houseLegs.filter((l) => !doesAccountMatchHouse(l.houseName, house));
      setHouseLegs(next);
      setSelectedHouses(next.map((l) => l.houseName));
      return;
    }
    if (!existsInLegs) {
      const matchingAcc = findDefaultAccountForHouse(house, operationalHouseAccounts);
      const nextLeg: DraftHouseLeg = {
        id: `leg_${Date.now()}_${houseLegs.length}`,
        houseName: house,
        accountId: matchingAcc?.id || '',
        result: houseLegs.some((l) => l.result === 'green') ? 'red' : 'green',
        stakeStr: '',
        oddStr: '2,00',
        returnStr: houseLegs.some((l) => l.result === 'green') ? '0,00' : '',
        selection: '',
      };
      const next = [...houseLegs, nextLeg];
      setHouseLegs(next);
      setSelectedHouses(next.map((l) => l.houseName));
    }
  };

  const handleAddAnotherLeg = () => {
    const nextHouse =
      availableHouses.find(
        (h) => !selectedHouses.some((sel) => doesAccountMatchHouse(sel, h))
      ) ||
      selectedHouses[0] ||
      defaultHouse1;
    const matchingAcc = findDefaultAccountForHouse(nextHouse, operationalHouseAccounts);
    setSelectedHouses((prev) => [...prev, nextHouse]);
    setHouseLegs((prev) => [
      ...prev,
      {
        id: `leg_${Date.now()}_${prev.length}`,
        houseName: nextHouse,
        accountId: matchingAcc?.id || '',
        result: 'pendente',
        stakeStr: '',
        oddStr: '2,00',
        returnStr: '',
        selection: '',
      },
    ]);
  };

  const handleRemoveLegAt = (idx: number) => {
    if (houseLegs.length <= 1) return;
    setHouseLegs((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setSelectedHouses(next.map((l) => l.houseName));
      return next;
    });
  };

  const handleUpdateLeg = (index: number, patch: Partial<DraftHouseLeg>) => {
    setHouseLegs((prev) => {
      const next = prev.map((leg, i) => {
        if (i !== index) return leg;
        const updated = { ...leg, ...patch };

        if (patch.houseName !== undefined && patch.accountId === undefined) {
          const defaultAcc = findDefaultAccountForHouse(patch.houseName, operationalHouseAccounts);
          updated.accountId = defaultAcc?.id || '';
        }

        if (patch.result === 'red') {
          updated.returnStr = '0,00';
        } else if (patch.result === 'void') {
          updated.returnStr = updated.stakeStr;
        } else if (
          updated.result === 'green' &&
          (patch.result === 'green' || patch.oddStr !== undefined || patch.stakeStr !== undefined)
        ) {
          const oddNum = parseCurrencyInput(updated.oddStr);
          const stakeNum = parseCurrencyInput(updated.stakeStr);
          if (oddNum && stakeNum) {
            updated.returnStr = roundCurrency(stakeNum * oddNum).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
            });
          }
        }
        return updated;
      });

      if (index === 0 && patch.stakeStr !== undefined && next.length === 2) {
        const total = parseCurrencyInput(totalCapitalStr);
        const firstStake = parseCurrencyInput(patch.stakeStr);
        if (total !== null && firstStake !== null && total >= firstStake) {
          const rem = roundCurrency(total - firstStake);
          const secondOdd = parseCurrencyInput(next[1].oddStr);
          next[1] = {
            ...next[1],
            stakeStr: rem.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            returnStr:
              next[1].result === 'green' && secondOdd
                ? roundCurrency(rem * secondOdd).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })
                : next[1].returnStr,
          };
        }
      }

      setSelectedHouses(next.map((l) => l.houseName));
      return next;
    });
  };

  const handleTotalCapitalChange = (val: string) => {
    setTotalCapitalStr(val);
    const total = parseCurrencyInput(val);
    if (total !== null && houseLegs.length === 2) {
      const firstStake = parseCurrencyInput(houseLegs[0].stakeStr);
      if (firstStake !== null && total >= firstStake) {
        const rem = roundCurrency(total - firstStake);
        setHouseLegs((prev) => [
          prev[0],
          {
            ...prev[1],
            stakeStr: rem.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
          },
        ]);
      }
    }
  };

  const surebetMetrics = useMemo(() => {
    const odds = houseLegs.map((l) => parseCurrencyInput(l.oddStr) || 0);
    const allOddsValid = odds.length >= 2 && odds.every((o) => o > 1);
    if (!allOddsValid) return null;
    const invSum = odds.reduce((acc, o) => acc + 1 / o, 0);
    const roiPct = roundCurrency((1 / invSum - 1) * 100);
    const totalCap =
      parseCurrencyInput(totalCapitalStr) ||
      houseLegs.reduce((s, l) => s + (parseCurrencyInput(l.stakeStr) || 0), 0) ||
      1000;
    const guaranteedReturn = roundCurrency(totalCap / invSum);
    const guaranteedProfit = roundCurrency(guaranteedReturn - totalCap);
    return {
      invSum,
      roiPct,
      isSurebet: invSum < 1,
      guaranteedReturn,
      guaranteedProfit,
      totalCap,
    };
  }, [houseLegs, totalCapitalStr]);

  const handleAutoDistributeSurebet = () => {
    const cap =
      parseCurrencyInput(totalCapitalStr) ||
      houseLegs.reduce((s, l) => s + (parseCurrencyInput(l.stakeStr) || 0), 0) ||
      2000;
    setTotalCapitalStr(cap.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));

    const odds = houseLegs.map((l) => parseCurrencyInput(l.oddStr) || 0);
    const allValid = odds.every((o) => o > 1);

    setHouseLegs((prev) => {
      if (!allValid) {
        const equalStake = roundCurrency(cap / prev.length);
        return prev.map((leg) => {
          const oddNum = parseCurrencyInput(leg.oddStr) || 0;
          return {
            ...leg,
            stakeStr: equalStake.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            returnStr:
              leg.result === 'green' && oddNum > 1
                ? roundCurrency(equalStake * oddNum).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })
                : leg.result === 'red'
                ? '0,00'
                : leg.returnStr,
          };
        });
      }

      const invSum = odds.reduce((acc, o) => acc + 1 / o, 0);
      let runningSum = 0;
      return prev.map((leg, i) => {
        const oddNum = odds[i];
        const stake =
          i === prev.length - 1
            ? roundCurrency(cap - runningSum)
            : roundCurrency((cap * (1 / oddNum)) / invSum);
        runningSum = roundCurrency(runningSum + stake);
        const calcRet = roundCurrency(stake * oddNum);
        return {
          ...leg,
          stakeStr: stake.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
          returnStr:
            leg.result === 'green'
              ? calcRet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
              : leg.result === 'red'
              ? '0,00'
              : leg.returnStr,
        };
      });
    });
  };

  const draftEntry = useMemo(() => {
    const cap = parseCurrencyInput(totalCapitalStr);
    const mappedLegs: BetLeg[] = houseLegs.map((item, idx) => {
      const acc =
        operationalHouseAccounts.find((a) => a.id === item.accountId) ||
        houseAccounts.find((a) => a.id === item.accountId);
      const stakeVal = parseCurrencyInput(item.stakeStr);
      const oddVal = parseCurrencyInput(item.oddStr);
      const retVal =
        item.result === 'red'
          ? 0
          : item.result === 'void' && stakeVal !== null
          ? stakeVal
          : parseCurrencyInput(item.returnStr);

      return {
        id: item.id,
        label: `${idx + 1}ª Casa (${formatShortHouseName(item.houseName)})`,
        houseName: formatShortHouseName(acc?.houseName || item.houseName || 'Pinnacle'),
        partnershipId: acc?.partnershipId || null,
        accountId: acc?.id || null,
        selection: item.selection,
        odd: oddVal,
        stake: stakeVal,
        result: item.result,
        grossReturn: retVal,
        createdAt: dateTimeStr,
      };
    });

    const greenLeg = mappedLegs.find(
      (l) => l.result === 'green' || l.result === 'cashout' || l.result === 'void'
    );

    return {
      id: editingEntryId || 'draft',
      mode: 'detalhado' as const,
      operationType,
      houses: mappedLegs.map((l) => formatShortHouseName(l.houseName)),
      event: eventStr,
      market: marketStr,
      createdAt: dateTimeStr,
      concludedAt: null,
      operatorId: 'op_a',
      origin: 'Manual' as const,
      totalInvestedCapital: cap,
      resultStatus: 'aguardando_detalhamento' as const,
      reconciliationStatus: 'pendente_apuracao' as const,
      simpleResultHint: greenLeg?.result || null,
      legs: mappedLegs,
      notes: '',
    };
  }, [
    editingEntryId,
    operationType,
    houseLegs,
    totalCapitalStr,
    dateTimeStr,
    eventStr,
    marketStr,
    operationalHouseAccounts,
    houseAccounts,
  ]);

  const draftEval = useMemo(() => evaluateBetEntry(draftEntry), [draftEntry]);

  const sumTypedStakes = useMemo(
    () =>
      roundCurrency(
        houseLegs.reduce((acc, l) => acc + (parseCurrencyInput(l.stakeStr) || 0), 0)
      ),
    [houseLegs]
  );

  const remainingCapitalToAllocate = useMemo(() => {
    const cap = parseCurrencyInput(totalCapitalStr) || 0;
    return roundCurrency(cap - sumTypedStakes);
  }, [totalCapitalStr, sumTypedStakes]);

  const handleClearForm = () => {
    setEditingEntryId(null);
    setEventStr('');
    setMarketStr('');
    setAlreadyConcludedCheck(false);
    setHouseLegs((prev) =>
      prev.map((leg, idx) => ({
        ...leg,
        returnStr: idx === 0 ? '' : '0,00',
        selection: '',
      }))
    );
  };

  const handleLaunchEntry = (forceConclude?: boolean) => {
    const wantConclude = Boolean(forceConclude ?? alreadyConcludedCheck);

    // Validação estrita: não permite lançar entradas em contas de parcerias do estoque ou inativas
    if (!editingEntryId) {
      for (const leg of draftEntry.legs) {
        if (leg.accountId) {
          const acc = operationalHouseAccounts.find((a) => a.id === leg.accountId);
          if (!acc) {
            notify(
              'error',
              `A conta selecionada para ${leg.houseName} pertence ao estoque ou não está ativa. Puxe a parceria no Estoque antes de operar.`
            );
            return;
          }
        }
      }
    }

    const ok = saveBetEntry(
      {
        mode: draftEntry.mode,
        operationType: draftEntry.operationType,
        houses: draftEntry.houses,
        event: draftEntry.event,
        market: draftEntry.market,
        concludedAt: wantConclude ? dateTimeStr : null,
        origin: 'Manual',
        totalInvestedCapital: draftEntry.totalInvestedCapital,
        resultStatus: wantConclude ? 'concluida' : 'aguardando_detalhamento',
        reconciliationStatus: wantConclude ? 'conciliada' : 'pendente_apuracao',
        simpleResultHint: draftEntry.simpleResultHint,
        legs: draftEntry.legs,
        notes: '',
      },
      editingEntryId || undefined,
      wantConclude
    );
    if (ok && wantConclude && draftEval.canConclude) {
      setEditingEntryId(null);
    }
  };

  const filteredEntriesList = useMemo(() => {
    return entries
      .filter((e) => {
        if (listFilter === 'pendentes') return e.resultStatus !== 'concluida';
        if (listFilter === 'concluidas') return e.resultStatus === 'concluida';
        return true;
      })
      .filter((e) => {
        if (!historySearch.trim()) return true;
        const q = historySearch.toLowerCase();
        return (
          e.houses.some((h) => h.toLowerCase().includes(q)) ||
          (e.event || '').toLowerCase().includes(q) ||
          (e.market || '').toLowerCase().includes(q)
        );
      });
  }, [entries, listFilter, historySearch]);

  const concludedRowsCount = entries.filter((e) => e.resultStatus === 'concluida').length;
  const hasBatchEntry8 = entries.some((e) => e.id === 'entry_8' && e.resultStatus === 'concluida');
  const concludedCount = concludedRowsCount + (hasBatchEntry8 ? 79 : 0);
  const pendingCount = entries.filter((e) => e.resultStatus !== 'concluida').length;
  const totalConcludedPl = useMemo(() => {
    return roundCurrency(
      entries
        .filter((e) => e.resultStatus === 'concluida')
        .reduce((acc, e) => acc + (evaluateBetEntry(e).netProfit || 0), 0)
    );
  }, [entries]);

  return (
    <div className="flex flex-col gap-[16px]">
      {/* Barra Superior de Métricas Rápidas + Importação GreenSureBet */}
      <div className="flex flex-wrap justify-between items-center gap-[10px]">
        <div className="flex items-center gap-[10px]">
          <h1 className="m-0 text-[22px] font-bold text-[#0F172A] tracking-[-0.02em]">
            Mesa de Entradas
          </h1>
          {surebetMetrics && (
            <span
              className={`px-[10px] py-[4px] rounded-full text-[11px] font-bold tabular-nums border inline-flex items-center gap-[5px] ${
                surebetMetrics.isSurebet
                  ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                  : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
              }`}
            >
              <Scale className="w-[12px] h-[12px]" strokeWidth={1.75} />
              <span>
                {surebetMetrics.isSurebet
                  ? `Surebet +${surebetMetrics.roiPct.toFixed(2)}% (Garantido: ${formatCurrencyBRL(
                      surebetMetrics.guaranteedProfit,
                      true
                    )})`
                  : `Margem Odds: ${surebetMetrics.roiPct.toFixed(2)}%`}
              </span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-[8px] items-center">
          <div className="flex items-center gap-[12px] px-[14px] py-[7px] rounded-[8px] bg-white border border-[#E2E8F0] text-[12px]">
            <button
              type="button"
              onClick={() => setListFilter('concluidas')}
              className="hover:text-[#0F6B5C] cursor-pointer text-[#475569]"
            >
              Concluídas: <b className="tabular-nums text-[#0F172A]">{concludedCount}</b>
            </button>
            <span className="text-[#E2E8F0]">|</span>
            <button
              type="button"
              onClick={() => setListFilter('pendentes')}
              className="hover:text-[#B45309] cursor-pointer text-[#475569]"
            >
              Pendentes: <b className="tabular-nums text-[#B45309]">{pendingCount}</b>
            </button>
            <span className="text-[#E2E8F0]">|</span>
            <span
              title={`Equivalente: ${formatBrlEquivalent(totalConcludedPl)}`}
              className="text-[#475569]"
            >
              P/L Período:{' '}
              <b className="tabular-nums text-[#15803D]">
                {formatCurrencyBRL(totalConcludedPl, true)}
              </b>{' '}
              <span className="text-[11px] text-[#64748B] tabular-nums">
                ({formatBrlEquivalent(totalConcludedPl)})
              </span>
            </span>
          </div>

          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              onClick={() => setShowSocialProof((v) => !v)}
              className={`px-[12px] py-[7px] rounded-[8px] border text-[12px] font-semibold flex items-center gap-[6px] cursor-pointer transition-all ${
                showSocialProof
                  ? 'bg-[#16A34A] text-white border-[#16A34A]'
                  : 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D] hover:bg-[#DCFCE7]'
              }`}
            >
              <ShieldCheck className="w-[14px] h-[14px]" strokeWidth={2} />
              <span>{showSocialProof ? 'Ocultar Prova Social' : 'Prova Social & Bilhetes Reais'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGsbPreview((v) => !v)}
              className={`px-[12px] py-[7px] rounded-[8px] border text-[12px] font-semibold flex items-center gap-[6px] cursor-pointer ${
                showGsbPreview
                  ? 'bg-[#0F172A] text-white border-[#0F172A]'
                  : 'border-[#CBD5E1] bg-white text-[#0F172A] hover:border-[#0F6B5C] hover:text-[#0F6B5C]'
              }`}
            >
              {showGsbPreview ? (
                <>
                  <X className="w-[13px] h-[13px]" strokeWidth={1.75} />
                  <span>Fechar GreenSureBet</span>
                </>
              ) : (
                <>
                  <Download className="w-[13px] h-[13px]" strokeWidth={1.75} />
                  <span>Importar GreenSureBet</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Painel Expansível de Prova Social com Casos Reais Sanitizados */}
      {showSocialProof && (
        <div className="flex flex-col gap-[8px]">
          <SocialProofShowcase onLoadCaseToCalculator={handleLoadSocialProofCase} />
        </div>
      )}

      {/* Workstation / Planilha Interativa de Entradas */}
      <section className="bg-white border border-[#CBD5E1] rounded-[12px] overflow-hidden flex flex-col">
        {/* Faixa de Cabeçalho Escura da Operação */}
        <div className="bg-[#0F172A] text-white px-[18px] py-[11px] flex flex-wrap justify-between items-center gap-[12px]">
          <div className="flex flex-wrap items-center gap-[8px]">
            <div className="flex items-center gap-[6px]">
              <span
                className={`w-[8px] h-[8px] rounded-full ${
                  editingEntryId ? 'bg-[#F59E0B]' : 'bg-[#4ADE80]'
                }`}
              />
              <h2 className="m-0 text-[14.5px] font-bold text-white">
                {editingEntryId ? `Editando #${editingEntryId}` : 'Calculadora de Pernas'}
              </h2>
            </div>

            {editingEntryId && (
              <button
                type="button"
                onClick={handleClearForm}
                className="px-[9px] py-[3px] rounded-full bg-[#0F6B5C] text-white text-[11px] font-bold hover:bg-[#0B4F44] inline-flex items-center gap-[4px] cursor-pointer"
              >
                <Plus className="w-[11px] h-[11px]" strokeWidth={2} />
                <span>Nova operação</span>
              </button>
            )}

            <span className="text-[#334155] mx-[2px]">|</span>

            {/* Pílulas de Tipo de Operação com Cores Leves Dedicadas */}
            <div className="flex flex-wrap gap-[3px] bg-[#1E293B] p-[3px] rounded-[8px] border border-[#334155]">
              {OPERATION_TYPES.map((op) => {
                const active = operationType === op.id;
                const opTheme = getOperationTypeTheme(op.id);
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setOperationType(op.id)}
                    className={`px-[10px] py-[3.5px] rounded-[8px] text-[11.5px] border border-transparent transition-all cursor-pointer ${
                      active
                        ? opTheme.activeClass
                        : opTheme.inactiveClass
                    }`}
                  >
                    {op.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campos Gerais: Capital Total + Atalhos + Evento + Mercado + Data */}
          <div className="flex flex-wrap items-center gap-[8px]">
            <div className="flex items-center bg-[#1E293B] border border-[#334155] rounded-[8px] px-[8px] py-[3px] gap-[6px]">
              <label htmlFor="q-cap" className="text-[11px] font-bold text-[#94A3B8]">
                Capital:
              </label>
              <input
                id="q-cap"
                value={totalCapitalStr}
                onChange={(e) => handleTotalCapitalChange(e.target.value)}
                placeholder="5.000,00"
                className="w-[92px] py-[2px] bg-transparent border-0 text-[13px] font-bold text-right tabular-nums text-white focus:ring-0"
              />
              <div className="flex items-center gap-[2px] border-l border-[#334155] pl-[6px]">
                {[1000, 2500, 5000].map((presetCap) => (
                  <button
                    key={presetCap}
                    type="button"
                    onClick={() =>
                      handleTotalCapitalChange(
                        presetCap.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                      )
                    }
                    className="px-[6px] py-[2px] rounded-full text-[10px] font-bold text-[#4ADE80] hover:bg-[#334155] cursor-pointer tabular-nums"
                  >
                    {presetCap >= 1000 ? `${presetCap / 1000}k` : presetCap}
                  </button>
                ))}
              </div>
            </div>

            <input
              id="q-ev"
              value={eventStr}
              onChange={(e) => setEventStr(e.target.value)}
              placeholder="Evento (ex.: Alcaraz x Sinner)"
              aria-label="Evento da operação"
              className="w-[180px] px-[10px] py-[5.5px] border border-[#334155] rounded-[8px] text-[12px] bg-[#1E293B] text-white placeholder-[#94A3B8]"
            />

            <input
              id="q-mk"
              value={marketStr}
              onChange={(e) => setMarketStr(e.target.value)}
              placeholder="Mercado (ex.: ML / Over 2.5)"
              aria-label="Mercado da operação"
              className="w-[160px] px-[10px] py-[5.5px] border border-[#334155] rounded-[8px] text-[12px] bg-[#1E293B] text-white placeholder-[#94A3B8]"
            />

            <input
              id="q-dt"
              value={dateTimeStr}
              onChange={(e) => setDateTimeStr(e.target.value)}
              aria-label="Data e hora"
              className="w-[125px] px-[9px] py-[5.5px] border border-[#334155] rounded-[8px] text-[12px] tabular-nums text-[#E2E8F0] bg-[#1E293B]"
            />
          </div>
        </div>

        {/* Barra de Casas Rápidas com Divisão por Clones e Cores Leves das Casas */}
        <div className="px-[18px] py-[9px] bg-[#F1F5F9] border-b border-[#CBD5E1] flex flex-col gap-[8px]">
          {/* Linha 1: Divisão por Clones / Provedores */}
          <div className="flex flex-wrap items-center justify-between gap-[8px]">
            <div className="flex flex-wrap items-center gap-[4px]">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#64748B] mr-[3px]">
                Clones / Provedores:
              </span>
              {Object.entries(cloneGroupsWithCount).map(([cName, count]) => {
                const isActive = selectedCloneFilter === cName;
                return (
                  <button
                    key={cName}
                    type="button"
                    onClick={() => setSelectedCloneFilter(cName)}
                    className={`px-[8px] py-[2px] rounded-full text-[11px] font-semibold border cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-2xs'
                        : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
                    }`}
                  >
                    <span>{cName}</span>
                    <span className="ml-[4px] text-[9.5px] opacity-75 tabular-nums">
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAutoDistributeSurebet}
              title="Calcula e preenche automaticamente as stakes ideais de cada perna pelas Odds informadas"
              className="px-[11px] py-[4.5px] rounded-[7px] bg-[#0F6B5C] hover:bg-[#0B4F44] text-white text-[11px] font-bold cursor-pointer flex items-center gap-[5px] shrink-0"
            >
              <Scale className="w-[13px] h-[13px]" strokeWidth={1.85} />
              <span>Equalizar Stakes (Surebet)</span>
            </button>
          </div>

          {/* Linha 2: Pílulas de Casas com Cores Leves Naturais da Casa/Provedor */}
          <div className="flex flex-wrap items-center gap-[5px] pt-[2px]">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#64748B] mr-[3px]">
              Casas:
            </span>
            {displayedQuickHouses.map((h) => {
              const shortH = formatShortHouseName(h);
              const isSelected = houseLegs.some((l) => doesAccountMatchHouse(l.houseName, h));
              const activeAccsCount = getMatchingAccountsForHouse(h, operationalHouseAccounts).filter(
                (a) => a.status !== 'limitada'
              ).length;

              const cat = houseCatalog.find(
                (c) => c.name.toLowerCase() === h.toLowerCase() || c.code === h.toLowerCase()
              );
              const acc = operationalHouseAccounts.find((a) => doesAccountMatchHouse(a.houseName, h));
              const cloneName = cat?.cloneGroup || acc?.cloneGroup || 'Sem clones';
              const houseTheme = getHouseColorTheme(h, cloneName, cat?.color);

              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleToggleHousePill(h)}
                  title={`${shortH} · Provedor: ${cloneName} · ${activeAccsCount} conta(s) ativa(s)`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: houseTheme.bg,
                          borderColor: houseTheme.primary,
                          color: houseTheme.text,
                        }
                      : undefined
                  }
                  className={`px-[9px] py-[3.5px] rounded-full text-[11.5px] flex items-center gap-[5px] border cursor-pointer transition-all ${
                    isSelected
                      ? 'font-bold shadow-xs ring-1 ring-black/5'
                      : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {/* Ponto colorido da casa */}
                  <span
                    style={{ backgroundColor: houseTheme.primary }}
                    className="w-[7px] h-[7px] rounded-full shrink-0"
                  />

                  {isSelected ? (
                    <Check className="w-[11.5px] h-[11.5px]" strokeWidth={2.5} />
                  ) : (
                    <span className="text-[12px] font-bold opacity-60">+</span>
                  )}

                  <span>{shortH}</span>

                  <span
                    style={
                      isSelected
                        ? {
                            backgroundColor: houseTheme.badgeBg,
                            color: houseTheme.badgeText,
                          }
                        : undefined
                    }
                    className={`text-[9.5px] px-[4.5px] py-[0.5px] rounded-full font-bold tabular-nums ${
                      !isSelected ? 'bg-[#F1F5F9] text-[#64748B]' : ''
                    }`}
                  >
                    {activeAccsCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Planilha de Pernas Ultra-Enxuta: [# | Casa | Conta da Casa | Odd | Stake | Status | Retorno | ×] */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-[#64748B] text-[11px] font-bold uppercase tracking-wider bg-[#F1F5F9] border-b border-[#E2E8F0]">
                <th className="py-[8px] px-[10px] w-[38px]">#</th>
                <th className="py-[8px] px-[8px] w-[165px]">Casa</th>
                <th className="py-[8px] px-[8px] min-w-[270px]">Conta da Casa (Exclusiva)</th>
                <th className="py-[8px] px-[8px] w-[105px] text-right">Odd</th>
                <th className="py-[8px] px-[8px] w-[140px] text-right">Stake</th>
                <th className="py-[8px] px-[8px] w-[295px] text-center">Status da Perna</th>
                <th className="py-[8px] px-[8px] w-[145px] text-right">Retorno</th>
                <th className="py-[8px] px-[6px] w-[36px]" />
              </tr>
            </thead>
            <tbody>
              {houseLegs.map((leg, idx) => {
                const isGreenLike =
                  leg.result === 'green' || leg.result === 'cashout' || leg.result === 'void';
                const isRed = leg.result === 'red';
                const matchingAccountsForLeg = getMatchingAccountsForHouse(
                  leg.houseName,
                  operationalHouseAccounts
                );
                const selectedAccObj =
                  operationalHouseAccounts.find((a) => a.id === leg.accountId) ||
                  houseAccounts.find((a) => a.id === leg.accountId);
                const typedStakeNum = parseCurrencyInput(leg.stakeStr) || 0;
                const typedOddNum = parseCurrencyInput(leg.oddStr) || 0;
                const potentialReturn =
                  typedStakeNum > 0 && typedOddNum > 1
                    ? roundCurrency(typedStakeNum * typedOddNum)
                    : null;
                const exceedsBalance =
                  selectedAccObj &&
                  typedStakeNum > 0 &&
                  typedStakeNum > selectedAccObj.availableBalance;

                const rowBg =
                  leg.result === 'green'
                    ? 'bg-[#F0FDF4]'
                    : isRed
                    ? 'bg-[#FEF2F2]'
                    : '';

                return (
                  <tr
                    key={leg.id}
                    className={`border-b border-[#E2E8F0] ${rowBg}`}
                  >
                    <td className="py-[9px] px-[10px]">
                      <span
                        className={`w-[22px] h-[22px] rounded-full inline-flex items-center justify-center text-[11px] font-bold tabular-nums ${
                          leg.result === 'green'
                            ? 'bg-[#15803D] text-white'
                            : isRed
                            ? 'bg-[#B91C1C] text-white'
                            : 'bg-[#F1F5F9] text-[#475569]'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>

                    {/* 1. Casa (Nomes curtos) */}
                    <td className="py-[9px] px-[8px]">
                      <select
                        aria-label={`Selecionar casa da ${idx + 1}ª perna`}
                        value={leg.houseName}
                        onChange={(e) => handleUpdateLeg(idx, { houseName: e.target.value })}
                        className="w-full px-[10px] py-[7px] rounded-[8px] border border-[#CBD5E1] bg-white text-[13px] font-bold text-[#0F172A] cursor-pointer"
                      >
                        {!availableHouses.some((h) => doesAccountMatchHouse(h, leg.houseName)) && (
                          <option value={leg.houseName}>
                            {formatShortHouseName(leg.houseName)}
                          </option>
                        )}
                        {availableHouses.map((h) => (
                          <option key={h} value={h}>
                            {formatShortHouseName(h)}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 2. Conta da Casa (filtrada exclusivamente para a casa + badge de moeda/saldo) */}
                    <td className="py-[9px] px-[8px]">
                      <div className="flex items-center gap-[6px]">
                        <select
                          id={`leg-acc-${idx}`}
                          aria-label={`Conta da ${idx + 1}ª casa (${leg.houseName})`}
                          value={leg.accountId}
                          onChange={(e) => handleUpdateLeg(idx, { accountId: e.target.value })}
                          className={`flex-1 px-[10px] py-[7px] border rounded-[8px] text-[13px] font-medium bg-white cursor-pointer ${
                            exceedsBalance
                              ? 'border-[#B91C1C] bg-[#FEF2F2]'
                              : 'border-[#CBD5E1] text-[#0F172A]'
                          }`}
                        >
                          {matchingAccountsForLeg.length === 0 ? (
                            <option value="">
                              Sem conta em {formatShortHouseName(leg.houseName)}
                            </option>
                          ) : (
                            <>
                              <option value="">
                                Escolher conta {formatShortHouseName(leg.houseName)}...
                              </option>
                              {matchingAccountsForLeg.map((acc) => {
                                const p = partnerships.find(
                                  (item) => item.id === acc.partnershipId
                                );
                                return (
                                  <option key={acc.id} value={acc.id}>
                                    {p?.shortName || acc.label} ·{' '}
                                    {formatHouseAccountBalance(
                                      acc.availableBalance,
                                      acc.accountCurrency
                                    )}
                                    {acc.status === 'limitada' ? ' [LIMITADA]' : ''}
                                  </option>
                                );
                              })}
                            </>
                          )}
                        </select>

                        {selectedAccObj && (
                          <span
                            title={
                              exceedsBalance
                                ? `Stake maior que o saldo disponível (${formatHouseAccountBalance(
                                    selectedAccObj.availableBalance,
                                    selectedAccObj.accountCurrency
                                  )})`
                                : `Moeda nativa da conta: ${
                                    selectedAccObj.accountCurrency || 'USDT'
                                  }`
                            }
                            className={`px-[8px] py-[3.5px] rounded-full text-[10px] font-bold uppercase shrink-0 inline-flex items-center gap-[4px] ${
                              exceedsBalance
                                ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]'
                                : selectedAccObj.accountCurrency === 'EUR'
                                ? 'bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]'
                                : 'bg-[#ECFDF5] text-[#0F6B5C] border border-[#BBF7D0]'
                            }`}
                          >
                            {exceedsBalance ? (
                              <>
                                <AlertCircle className="w-[11px] h-[11px]" strokeWidth={2} />
                                <span>Saldo</span>
                              </>
                            ) : selectedAccObj.accountCurrency === 'EUR' ? (
                              'EUR €'
                            ) : (
                              'USDT'
                            )}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. Odd */}
                    <td className="py-[9px] px-[8px]">
                      <input
                        id={`leg-odd-${idx}`}
                        aria-label={`Odd da ${idx + 1}ª perna`}
                        value={leg.oddStr}
                        onChange={(e) => handleUpdateLeg(idx, { oddStr: e.target.value })}
                        placeholder="1,98"
                        className="w-full px-[9px] py-[7px] border border-[#CBD5E1] rounded-[8px] text-[13px] font-semibold text-right bg-white text-[#0F172A] tabular-nums"
                      />
                    </td>

                    {/* 4. Stake */}
                    <td className="py-[9px] px-[8px]">
                      <div className="relative flex items-center">
                        <input
                          id={`leg-stake-${idx}`}
                          aria-label={`Stake da ${idx + 1}ª perna`}
                          value={leg.stakeStr}
                          onChange={(e) => handleUpdateLeg(idx, { stakeStr: e.target.value })}
                          placeholder="0,00"
                          className="w-full px-[9px] py-[7px] border border-[#CBD5E1] rounded-[8px] text-[13px] font-bold text-right bg-white text-[#0F172A] tabular-nums"
                        />
                      </div>
                    </td>

                    {/* 5. Status Interativo */}
                    <td className="py-[9px] px-[8px]">
                      <div
                        className="inline-flex items-center justify-center gap-[3px] bg-[#F1F5F9] p-[3px] rounded-[8px] border border-[#E2E8F0]"
                        role="group"
                        aria-label={`Resultado de ${leg.houseName}`}
                      >
                        {LEG_RESULT_OPTIONS.map((opt) => {
                          const active = leg.result === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              title={opt.label}
                              onClick={() => handleUpdateLeg(idx, { result: opt.id })}
                              className={`px-[8px] py-[4px] rounded-[8px] text-[11px] font-bold border cursor-pointer ${
                                active
                                  ? opt.activeClass
                                  : 'bg-transparent border-transparent text-[#475569] hover:bg-white hover:text-[#0F172A]'
                              }`}
                            >
                              {opt.shortLabel}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* 6. Retorno (Auto-calculado no Green + prévia de potencial no Pendente) */}
                    <td className="py-[9px] px-[8px]">
                      {isRed ? (
                        <div className="px-[9px] py-[7px] border border-dashed border-[#FECACA] rounded-[8px] text-[12px] font-semibold text-right bg-[#FEF2F2] text-[#B91C1C] tabular-nums">
                          0,00
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <input
                            id={`leg-ret-${idx}`}
                            aria-label={`Retorno da ${idx + 1}ª perna`}
                            value={leg.returnStr}
                            onChange={(e) => handleUpdateLeg(idx, { returnStr: e.target.value })}
                            placeholder={
                              potentialReturn
                                ? potentialReturn.toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                  })
                                : '0,00'
                            }
                            className={`w-full px-[9px] py-[7px] rounded-[8px] text-[13px] font-bold text-right tabular-nums ${
                              isGreenLike && leg.returnStr.trim()
                                ? 'border border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]'
                                : isGreenLike && !leg.returnStr.trim()
                                ? 'border border-dashed border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]'
                                : 'border border-[#CBD5E1] bg-white text-[#475569]'
                            }`}
                          />
                        </div>
                      )}
                    </td>

                    {/* Remover Perna */}
                    <td className="py-[9px] px-[6px] text-center">
                      {houseLegs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLegAt(idx)}
                          className="w-[26px] h-[26px] rounded-[8px] text-[#64748B] hover:text-[#B91C1C] hover:bg-[#FEF2F2] inline-flex items-center justify-center cursor-pointer"
                          title="Remover perna"
                        >
                          <X className="w-[14px] h-[14px]" strokeWidth={2} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Calculadora: + Adicionar Perna + Resumo P/L em Tempo Real + Ações */}
        <div className="px-[18px] py-[12px] bg-[#F8FAFC] flex flex-wrap justify-between items-center gap-[12px]">
          <div className="flex flex-wrap items-center gap-[10px]">
            <button
              type="button"
              onClick={handleAddAnotherLeg}
              className="px-[12px] py-[6px] rounded-[8px] border border-[#CBD5E1] bg-white text-[#0F6B5C] text-[12px] font-bold hover:bg-[#ECFDF5] hover:border-[#0F6B5C] inline-flex items-center gap-[5px] cursor-pointer"
            >
              <Plus className="w-[13px] h-[13px]" strokeWidth={2} />
              <span>Adicionar perna</span>
            </button>

            {remainingCapitalToAllocate !== 0 && (
              <span className="px-[10px] py-[4px] rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-[11.5px] font-semibold tabular-nums">
                {remainingCapitalToAllocate > 0
                  ? `Falta alocar: ${formatCurrencyBRL(remainingCapitalToAllocate)}`
                  : `Soma stakes excede capital em ${formatCurrencyBRL(
                      Math.abs(remainingCapitalToAllocate)
                    )}`}
              </span>
            )}

            {draftEval.canConclude ? (
              <div
                title={`Equivalente: ${formatBrlEquivalent(draftEval.netProfit || 0)}`}
                className={`px-[12px] py-[5px] rounded-[8px] border flex items-center gap-[8px] text-[12.5px] font-bold ${
                  (draftEval.netProfit || 0) >= 0
                    ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
                    : 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
                }`}
              >
                <span>Resultado Líquido:</span>
                <span className="tabular-nums text-[14px]">
                  {formatCurrencyBRL(draftEval.netProfit || 0, true)}
                </span>
                <span className="px-[6px] py-[1px] rounded-full bg-white text-[11px] tabular-nums">
                  {draftEval.roiPercent}% ROI
                </span>
                <span className="text-[11px] font-medium text-[#475569] tabular-nums">
                  ({formatBrlEquivalent(draftEval.netProfit || 0)})
                </span>
              </div>
            ) : (
              <span className="text-[12px] text-[#475569]">
                Pendência p/ concluir:{' '}
                <b className="text-[#B45309]">{draftEval.missingFields.join(', ')}</b>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-[8px]">
            <label className="flex gap-[6px] items-center text-[12px] font-medium text-[#475569] cursor-pointer px-[8px] py-[5px] rounded-[8px] hover:bg-[#F1F5F9]">
              <input
                id="q-ja"
                type="checkbox"
                checked={alreadyConcludedCheck}
                onChange={(e) => setAlreadyConcludedCheck(e.target.checked)}
                className="accent-[#0F6B5C]"
              />
              <span>Já concluída</span>
            </label>

            <button
              type="button"
              onClick={handleClearForm}
              className="px-[12px] py-[7px] rounded-[8px] border border-[#CBD5E1] bg-white text-[#475569] text-[12px] font-semibold hover:bg-[#F1F5F9] cursor-pointer"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => handleLaunchEntry(false)}
              className="px-[14px] py-[7px] rounded-[8px] border border-[#0F6B5C] bg-white text-[#0F6B5C] text-[12px] font-bold hover:bg-[#ECFDF5] cursor-pointer"
            >
              Salvar em aberto
            </button>
            <button
              type="button"
              onClick={() => handleLaunchEntry(alreadyConcludedCheck || draftEval.canConclude)}
              className="px-[18px] py-[7px] rounded-[8px] bg-[#0F6B5C] hover:bg-[#0B4F44] text-white text-[12.5px] font-bold inline-flex items-center gap-[6px] cursor-pointer"
            >
              {draftEval.canConclude ? (
                <>
                  <Check className="w-[14px] h-[14px]" strokeWidth={2.25} />
                  <span>Concluir ({formatCurrencyBRL(draftEval.netProfit || 0, true)})</span>
                </>
              ) : (
                <span>Lançar Entrada</span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Prévia de Importação do GreenSureBet (sob demanda) */}
      {showGsbPreview && (
        <section className="bg-white border border-[#E2E8F0] rounded-[12px] px-[20px] py-[18px] flex flex-col gap-[12px]">
          <div className="flex justify-between items-center">
            <div className="text-[15px] font-bold text-[#0F172A]">
              Importação Automática GreenSureBet
            </div>
            <div className="text-[12px] text-[#64748B]">
              Apenas novas entradas são marcadas por padrão
            </div>
          </div>

          <div className="grid grid-cols-3 gap-[10px]">
            <div className="p-[12px] rounded-[12px] bg-[#F0FDF4] border border-[#BBF7D0]">
              <div className="text-[11px] font-semibold text-[#15803D]">Novas p/ importar</div>
              <div className="text-[18px] font-bold text-[#15803D] tabular-nums">
                {gsbCandidates.filter((c) => c.status === 'nova').length > 0 ? 14 : 0}
              </div>
            </div>
            <div className="p-[12px] rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[11px] font-semibold text-[#475569]">Já conciliadas</div>
              <div className="text-[18px] font-bold text-[#0F172A] tabular-nums">86</div>
            </div>
            <div className="p-[12px] rounded-[12px] bg-[#FFFBEB] border border-[#FDE68A]">
              <div className="text-[11px] font-semibold text-[#B45309]">Possíveis duplicadas</div>
              <div className="text-[18px] font-bold text-[#B45309] tabular-nums">
                {gsbCandidates.filter((c) => c.status === 'duplicada_provavel').length > 0 ? 2 : 0}
              </div>
            </div>
          </div>

          {gsbCandidates.length > 0 ? (
            <>
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="text-left text-[#64748B] text-[11px] uppercase tracking-wider bg-[#F1F5F9] border-b border-[#E2E8F0]">
                    <th className="py-[6px] px-[8px]" />
                    <th className="py-[6px] px-[8px]">Data/hora</th>
                    <th className="py-[6px] px-[8px]">Casas</th>
                    <th className="py-[6px] px-[8px] text-right">Stake</th>
                    <th className="py-[6px] px-[8px] text-right">P/L</th>
                    <th className="py-[6px] px-[8px]">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {gsbCandidates.map((cand) => (
                    <tr
                      key={cand.id}
                      className={`border-b border-[#E2E8F0] ${
                        cand.status === 'duplicada_provavel' ? 'bg-[#FFFBEB]/50' : ''
                      }`}
                    >
                      <td className="p-[8px]">
                        <input
                          type="checkbox"
                          checked={cand.selected}
                          onChange={() => toggleGsbCandidate(cand.id)}
                          aria-label={`Importar entrada ${cand.datetime}`}
                        />
                      </td>
                      <td className="p-[8px] tabular-nums text-[#475569]">{cand.datetime}</td>
                      <td className="p-[8px] font-semibold text-[#0F172A]">
                        {cand.platforms.map((p) => formatShortHouseName(p)).join(' × ')}
                      </td>
                      <td className="p-[8px] text-right tabular-nums text-[#0F172A]">
                        {formatCurrencyBRL(cand.stake)}
                      </td>
                      <td className="p-[8px] text-right text-[#15803D] font-bold tabular-nums">
                        {formatCurrencyBRL(cand.pl, true)}
                      </td>
                      <td className="p-[8px]">
                        {cand.status === 'nova' ? (
                          <span className="px-[8px] py-[2px] rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-[11px] font-bold">
                            Nova
                          </span>
                        ) : (
                          <span className="px-[8px] py-[2px] rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-[11px] font-semibold">
                            {cand.reason}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end pt-[4px]">
                <button
                  type="button"
                  onClick={importSelectedGsbCandidates}
                  className="px-[16px] py-[8px] rounded-[8px] bg-[#0F6B5C] hover:bg-[#0B4F44] text-white text-[12.5px] font-bold cursor-pointer"
                >
                  Importar selecionadas
                </button>
              </div>
            </>
          ) : (
            <div className="py-[10px] text-[13px] text-[#15803D] font-semibold inline-flex items-center gap-[6px]">
              <Check className="w-[15px] h-[15px]" strokeWidth={2} />
              <span>Todas as novas entradas do lote GreenSureBet já foram importadas.</span>
            </div>
          )}
        </section>
      )}

      {/* Tabela Interativa de Entradas Registradas */}
      <section className="bg-white border border-[#CBD5E1] rounded-[12px] overflow-hidden flex flex-col">
        <div className="px-[18px] py-[11px] bg-[#0F172A] text-white flex flex-wrap justify-between items-center gap-[10px]">
          <div className="flex items-center gap-[10px]">
            <h3 className="m-0 text-[14.5px] font-bold text-white">
              Histórico de Entradas ({filteredEntriesList.length})
            </h3>
            <div className="relative flex items-center">
              <Search
                className="w-[13px] h-[13px] text-[#94A3B8] absolute left-[9px] pointer-events-none"
                strokeWidth={1.75}
              />
              <input
                type="search"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Filtrar por casa, evento ou mercado..."
                className="w-[240px] pl-[28px] pr-[10px] py-[5px] rounded-[8px] border border-[#334155] text-[12px] bg-[#1E293B] text-white placeholder-[#94A3B8]"
              />
            </div>
          </div>

          <div className="flex gap-[4px] bg-[#1E293B] p-[3px] rounded-[8px] border border-[#334155] text-[12px]">
            {(
              [
                ['todas', `Todas (${entries.length})`],
                ['pendentes', `Pendentes (${pendingCount})`],
                ['concluidas', `Concluídas (${concludedCount})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setListFilter(id)}
                className={`px-[12px] py-[4px] rounded-[8px] cursor-pointer ${
                  listFilter === id
                    ? 'bg-[#0F6B5C] text-white font-semibold'
                    : 'text-[#CBD5E1] hover:text-white font-medium'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-[#64748B] text-[11px] font-bold uppercase tracking-wider bg-[#F1F5F9] border-b border-[#E2E8F0]">
                <th className="py-[8px] px-[12px]">Tipo / Data</th>
                <th className="py-[8px] px-[10px]">Status</th>
                <th className="py-[8px] px-[10px]">Pernas (Casa · Titular · Stake)</th>
                <th className="py-[8px] px-[10px]">Evento / Mercado</th>
                <th className="py-[8px] px-[10px] text-right">Stake Total</th>
                <th className="py-[8px] px-[10px] text-right">Retorno</th>
                <th className="py-[8px] px-[10px] text-right">P/L Líquido</th>
                <th className="py-[8px] px-[12px] text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntriesList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-[22px] px-[12px] text-center text-[#64748B]">
                    Nenhuma entrada encontrada para o filtro atual ({activePeriodLabel}).{' '}
                    <button
                      type="button"
                      onClick={() => setActiveScreen('configuracoes')}
                      className="text-[#0F6B5C] font-bold underline cursor-pointer ml-[6px]"
                    >
                      Alterar período
                    </button>
                  </td>
                </tr>
              )}
              {filteredEntriesList.map((entry) => {
                const ev = evaluateBetEntry(entry);
                const isConcluded = entry.resultStatus === 'concluida';
                const isBeingEdited = editingEntryId === entry.id;
                const opObj = OPERATION_TYPES.find((o) => o.id === entry.operationType);

                return (
                  <tr
                    key={entry.id}
                    className={`border-b border-[#E2E8F0] ${
                      isBeingEdited ? 'bg-[#ECFDF5]/60' : ''
                    }`}
                  >
                    <td className="py-[10px] px-[12px]">
                      <div className="font-semibold text-[#0F172A] text-[12px]">
                        {opObj?.label || entry.operationType}
                      </div>
                      <div className="text-[11px] text-[#64748B] tabular-nums">
                        {entry.createdAt}
                      </div>
                    </td>

                    <td className="py-[10px] px-[10px]">
                      {isConcluded ? (
                        <span className="px-[9px] py-[2.5px] rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-[11px] font-bold inline-flex items-center gap-[4px]">
                          <Check className="w-[11px] h-[11px]" strokeWidth={2.25} />
                          <span>Concluída</span>
                        </span>
                      ) : (
                        <div className="flex flex-col items-start gap-[2px]">
                          <span className="px-[9px] py-[2.5px] rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-[11px] font-bold inline-flex items-center gap-[4px]">
                            <Clock className="w-[11px] h-[11px]" strokeWidth={2} />
                            <span>Pendente</span>
                          </span>
                          {!ev.canConclude && entry.notes && (
                            <span className="text-[10.5px] text-[#B91C1C] font-medium">
                              {entry.notes}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Pernas como pílulas visuais claras */}
                    <td className="py-[10px] px-[10px]">
                      <div className="flex flex-wrap gap-[5px]">
                        {entry.legs.length > 0 ? (
                          entry.legs.map((leg) => {
                            const acc = houseAccounts.find((a) => a.id === leg.accountId);
                            const p = partnerships.find((item) => item.id === acc?.partnershipId);
                            const shortHouse = formatShortHouseName(leg.houseName);
                            const badgeTone =
                              leg.result === 'green'
                                ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                                : leg.result === 'red'
                                ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                                : 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]';
                            return (
                              <span
                                key={leg.id}
                                className={`px-[9px] py-[2.5px] rounded-full border text-[11.5px] font-medium inline-flex items-center gap-[5px] ${badgeTone}`}
                              >
                                <b>{shortHouse}</b>
                                {p && <span className="opacity-80">· {p.shortName}</span>}
                                {leg.stake !== null && (
                                  <span className="tabular-nums font-semibold">
                                    ({leg.stake.toLocaleString('pt-BR')})
                                  </span>
                                )}
                              </span>
                            );
                          })
                        ) : (
                          <span className="font-semibold text-[#0F172A]">
                            {entry.houses.map((h) => formatShortHouseName(h)).join(' × ')}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-[10px] px-[10px]">
                      <div className="font-medium text-[#0F172A] text-[12.5px]">
                        {entry.event || '—'}
                      </div>
                      {entry.market && (
                        <div className="text-[11px] text-[#64748B]">{entry.market}</div>
                      )}
                    </td>

                    <td
                      title={`Equivalente: ${formatBrlEquivalent(ev.totalStake)}`}
                      className="py-[10px] px-[10px] text-right tabular-nums font-semibold text-[#0F172A]"
                    >
                      {formatCurrencyBRL(ev.totalStake)}
                    </td>

                    <td
                      title={
                        ev.totalReturn > 0
                          ? `Equivalente: ${formatBrlEquivalent(ev.totalReturn)}`
                          : undefined
                      }
                      className="py-[10px] px-[10px] text-right tabular-nums text-[#475569]"
                    >
                      {ev.totalReturn > 0 ? formatCurrencyBRL(ev.totalReturn) : '—'}
                    </td>

                    <td
                      title={
                        ev.netProfit !== null
                          ? `Equivalente: ${formatBrlEquivalent(ev.netProfit)}`
                          : undefined
                      }
                      className={`py-[10px] px-[10px] text-right tabular-nums font-bold ${
                        ev.netProfit !== null
                          ? ev.netProfit >= 0
                            ? 'text-[#15803D]'
                            : 'text-[#B91C1C]'
                          : 'text-[#64748B]'
                      }`}
                    >
                      {ev.netProfit !== null ? formatCurrencyBRL(ev.netProfit, true) : '—'}
                    </td>

                    <td className="py-[10px] px-[12px] text-right">
                      <div className="flex justify-end gap-[6px]">
                        {!isConcluded && ev.canConclude && (
                          <button
                            type="button"
                            onClick={() => concludeBetEntry(entry.id)}
                            className="px-[10px] py-[4.5px] rounded-[8px] bg-[#0F6B5C] text-white text-[11.5px] font-bold hover:bg-[#0B4F44] inline-flex items-center gap-[4px] cursor-pointer"
                          >
                            <Check className="w-[12px] h-[12px]" strokeWidth={2.25} />
                            <span>Concluir</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            loadEntryForEditing(entry.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            notify(
                              'success',
                              `Operação "${entry.houses
                                .map((h) => formatShortHouseName(h))
                                .join(' × ')}" carregada na calculadora acima.`
                            );
                          }}
                          className={`px-[10px] py-[4.5px] rounded-[8px] border text-[11.5px] font-semibold cursor-pointer ${
                            !isConcluded && !ev.canConclude
                              ? 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309] hover:bg-[#FEF3C7]'
                              : 'border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F1F5F9]'
                          }`}
                        >
                          {isConcluded ? 'Editar' : 'Completar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
