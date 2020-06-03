import React, { useCallback } from 'react'
import {
  BackButton,
  Bar,
  Box,
  GU,
  Help,
  IconCheck,
  IconTime,
  Split,
  Tag,
  Timer,
  TransactionBadge,
  textStyle,
  useLayout,
  useTheme,
} from '@aragon/ui'
import { useAppState, useConnectedAccount, useNetwork } from '@aragon/api-react'
import { format } from 'date-fns'
import DisputableActionStatus from '../components/VoteDetail/DisputableActionStatus'
import LocalIdentityBadge from '../components/LocalIdentityBadge/LocalIdentityBadge'
import LocalLabelAppBadge from '../components/LocalIdentityBadge/LocalLabelAppBadge'
import SummaryBar from '../components/SummaryBar'
import SummaryRows from '../components/SummaryRows'
import VoteActions from '../components/VoteActions'
import VoteCast from '../components/VoteCast'
import VoteInfoBoxes from '../components/VoteDetail/VoteInfoBoxes'
import VoteStatus from '../components/VoteStatus'
import VoteText from '../components/VoteText'
import { percentageList, round, safeDiv } from '../math-utils'
import { getQuorumProgress } from '../vote-utils'
import { VOTE_NAY, VOTE_YEA } from '../vote-types'
import { addressesEqual } from '../web3-utils'

const formatDate = date => `${format(date, 'do MMM yy, HH:mm')}`

const DEFAULT_DESCRIPTION =
  'No additional description has been provided for this proposal.'

function VoteDetail({ vote, onBack, onVote, onExecute }) {
  const theme = useTheme()
  const { layoutName } = useLayout()
  const { tokenSymbol } = useAppState()
  const connectedAccount = useConnectedAccount()

  const {
    connectedAccountVote,
    data,
    executionTargetData,
    numData,
    voteId,
  } = vote
  const { minAcceptQuorum, supportRequired, yea, nay } = numData
  const { creator, description, metadata, open } = data
  const quorumProgress = getQuorumProgress(vote)
  const totalVotes = yea + nay
  const votesYeaVotersSize = safeDiv(yea, totalVotes)
  const votesNayVotersSize = safeDiv(nay, totalVotes)
  const [yeaPct, nayPct] = percentageList(
    [votesYeaVotersSize, votesNayVotersSize],
    2
  )
  const youVoted =
    connectedAccountVote === VOTE_YEA || connectedAccountVote === VOTE_NAY

  const handleVoteNo = useCallback(() => {
    onVote(voteId, VOTE_NAY)
  }, [onVote, voteId])
  const handleVoteYes = useCallback(() => {
    onVote(voteId, VOTE_YEA)
  }, [onVote, voteId])

  const handleExecute = useCallback(() => {
    onExecute(voteId)
  }, [onExecute, voteId])

  return (
    <React.Fragment>
      <Bar>
        <BackButton onClick={onBack} />
      </Bar>
      <Split
        primary={
          <React.Fragment>
            <Box>
              <div
                css={`
                  display: flex;
                  justify-content: space-between;
                `}
              >
                {executionTargetData && (
                  <LocalLabelAppBadge
                    appAddress={executionTargetData.address}
                    iconSrc={executionTargetData.iconSrc}
                    identifier={executionTargetData.identifier}
                    label={executionTargetData.name}
                  />
                )}
                {youVoted && (
                  <Tag icon={<IconCheck size="small" />} label="Voted" />
                )}
              </div>
              <section
                css={`
                  display: grid;
                  grid-template-columns: auto;
                  grid-gap: ${2.5 * GU}px;
                  margin-top: ${2.5 * GU}px;
                `}
              >
                <h1
                  css={`
                    ${textStyle('title2')};
                  `}
                >
                  <span css="font-weight: bold;">Vote #{voteId}</span>
                </h1>
                <div
                  css={`
                    display: grid;
                    grid-template-columns: ${layoutName === 'large'
                      ? '1fr minmax(300px, auto)'
                      : 'auto'};
                    grid-gap: ${layoutName === 'large' ? 5 * GU : 2.5 * GU}px;
                  `}
                >
                  <div>
                    <h2
                      css={`
                        ${textStyle('label2')};
                        color: ${theme.surfaceContentSecondary};
                        margin-bottom: ${2 * GU}px;
                      `}
                    >
                      Description
                    </h2>
                    <VoteText
                      text={description || metadata || DEFAULT_DESCRIPTION}
                      css={`
                        ${textStyle('body2')};
                      `}
                    />
                  </div>
                  <div>
                    <h2
                      css={`
                        ${textStyle('label2')};
                        color: ${theme.surfaceContentSecondary};
                        margin-bottom: ${2 * GU}px;
                      `}
                    >
                      Created By
                    </h2>
                    <div
                      css={`
                        display: flex;
                        align-items: flex-start;
                      `}
                    >
                      <LocalIdentityBadge
                        connectedAccount={addressesEqual(
                          creator,
                          connectedAccount
                        )}
                        entity={creator}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h2
                    css={`
                      ${textStyle('label2')};
                      color: ${theme.surfaceContentSecondary};
                      margin-bottom: ${2 * GU}px;
                    `}
                  >
                    {open ? 'Current votes' : 'Votes'}
                  </h2>
                  <SummaryBar
                    positiveSize={votesYeaVotersSize}
                    negativeSize={votesNayVotersSize}
                    requiredSize={supportRequired}
                    css={`
                      margin-bottom: ${2 * GU}px;
                    `}
                  />
                  <SummaryRows
                    yea={{ pct: yeaPct, amount: yea }}
                    nay={{ pct: nayPct, amount: nay }}
                    symbol={tokenSymbol}
                    connectedAccountVote={connectedAccountVote}
                  />
                  {youVoted && <VoteCast vote={vote} />}
                </div>
                <VoteActions
                  onExecute={handleExecute}
                  onVoteNo={handleVoteNo}
                  onVoteYes={handleVoteYes}
                  vote={vote}
                />
                {vote.disputable &&
                  vote.disputable.disputableStatus === 'Paused' && (
                    <Info type="warning">
                      This vote has been paused as the result of the originating
                      action being challenged. When the challenge is resolved,
                      if allowed, the voting period will resume and last the
                      rest of its duration time. Othersiwe, it will be
                      cancelled.
                    </Info>
                  )}
                {vote.disputable &&
                  vote.disputable.disputableStatus === 'Cancelled' && (
                    <Info type="warning">
                      This vote has been cancelled as the result of the
                      originating action being challenged and the settlement
                      offer being accepted.
                    </Info>
                  )}
              </section>
            </Box>
            <VoteInfoBoxes vote={vote} />
          </React.Fragment>
        }
        secondary={<DisputableActionStatus />}
      />
    </React.Fragment>
  )
}

export default VoteDetail
