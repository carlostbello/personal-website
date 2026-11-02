import { useState } from 'react'
import { Bar, Check, Collapse, Fly, Icon, Caret, Stage, States, Window, type Act, type Layout } from '../../stageshow/kit'
import './handoff.css'

// Plan (Stageshow workflow, step 1–3)
// Place: the Handoff project page, a full-width panel ~860px wide; compact
//   design for the phone column at 358.
// Story: what the system does. One command in opencode on the laptop; the
//   session leaves encrypted, a T3 Code thread on the homelab does the work,
//   the commits come back into the same session. No pointer: typing is the
//   only gesture, the rest is the system.
// Beats: type /handoff → three client steps tick (snapshot, brief, encrypt)
//   → T3 window arrives, the locked job flies into it → the agent's steps
//   tick → "3 commits" flies back and lands in the terminal (payoff).
// Layout: corner bleed. Terminal is the hero (inset top-left, off the
//   bottom); the T3 window is the satellite straddling its right edge over
//   the terminal's empty right margin.
// Real strings: the command, three step labels, the thread title, the branch,
//   the result line. Everything else is quiet.

type S = {
  typed: string
  sent: boolean
  client: number // client steps shown (0–3)
  ticked: number // client steps done
  host: boolean // T3 window in
  jobGo: boolean
  jobIn: boolean
  work: number // host steps done (0–3)
  resReady: boolean
  resGo: boolean
  resIn: boolean
  note: boolean
}

const CMD = '/handoff add retry logic to the uploader'

const initial: S = {
  typed: '',
  sent: false,
  client: 0,
  ticked: 0,
  host: false,
  jobGo: false,
  jobIn: false,
  work: 0,
  resReady: false,
  resGo: false,
  resIn: false,
  note: false,
}

const POSTER: S = {
  typed: CMD,
  sent: true,
  client: 3,
  ticked: 3,
  host: true,
  jobGo: false,
  jobIn: true,
  work: 3,
  resReady: true,
  resGo: false,
  resIn: true,
  note: true,
}

const CLIENT_STEPS = [
  { label: 'snapshot', detail: '3 files' },
  { label: 'brief', detail: 'for the agent' },
  { label: 'encrypt', detail: 'to the relay' },
]
const HOST_STEPS = ['Read brief.md', 'Backoff in upload()', 'Tests pass']
const DIFF: [kind: 'ctx' | 'add' | 'del', w: number][] = [
  ['ctx', 120],
  ['del', 96],
  ['add', 150],
  ['add', 132],
  ['add', 84],
  ['ctx', 110],
]

async function script(a: Act<S>) {
  await a.wait(700)
  await a.type('typed', CMD)
  await a.wait(250)
  await a.key('enter')
  await a.set({ sent: true, client: 1 })

  // The client side: each step opens its line, then ticks
  for (let i = 1; i <= 3; i++) {
    await a.wait(520)
    await a.set({ ticked: i, client: Math.min(3, i + 1) })
  }
  await a.wait(350)

  // The host comes forward, then the locked job lands in it
  await a.set({ host: true })
  await a.wait(800)
  await a.set({ jobGo: true, note: true })
  await a.wait(820)
  await a.set({ jobIn: true })
  await a.snap({ jobGo: false })

  // The agent works
  await a.wait(450)
  await a.stagger([1, 2, 3], (n) => a.set({ work: n }), 650)
  await a.wait(500)
  await a.set({ resReady: true })
  await a.wait(600)

  // The commits fly home: the payoff
  await a.set({ resGo: true })
  await a.wait(820)
  await a.set({ resIn: true })
  await a.snap({ resGo: false })
}

function Chip({ kind, ...rest }: { kind: 'job' | 'result' } & Record<`data-${string}`, unknown> & { style?: React.CSSProperties }) {
  return (
    <span className="hf-chip" data-kind={kind} {...rest}>
      <Icon name={kind === 'job' ? 'lock' : 'check'} size={12} filled />
      {kind === 'job' ? 'job, encrypted' : '3 commits'}
    </span>
  )
}

function Scene({ s, rect, layout }: { s: S; rect: (n: string) => import('../../stageshow/kit').Rect; layout: Layout }) {
  const compact = layout === 'compact'
  return (
    <>
      <Window chrome="terminal" lights="grey" title={compact ? undefined : 'laptop · opencode'} className="hf-term">
        <div className="hf-history dim">
          <span className="hf-sigil">›</span>why do uploads die on bad wifi?
        </div>
        <div className="hf-history">
          <span className="dim">upload() never retries a timeout.</span>
        </div>
        <div className="hf-input">
          <span className="hf-sigil">›</span>
          {s.typed}
          {!s.sent && <Caret />}
        </div>

        {CLIENT_STEPS.map((step, i) => (
          <Collapse key={step.label} open={s.client > i}>
            <div className="hf-line">
              <States
                className="hf-mark"
                value={s.ticked > i ? 'done' : 'busy'}
                states={{ busy: <span className="hf-spin">◐</span>, done: <span className="ok">✓</span> }}
              />
              <span className="hf-label">{step.label}</span>
              {!compact && <span className="dim">{step.detail}</span>}
              {i === 2 && (
                <Chip kind="job" data-target="job-from" data-hidden={!s.ticked || s.ticked < 3 || s.jobGo || s.jobIn || undefined} />
              )}
            </div>
          </Collapse>
        ))}

        <Collapse open={s.resIn}>
          <div className="hf-line hf-payoff">
            <span className="hf-mark ok">⇣</span>
            <Chip kind="result" data-target="res-to" data-hidden={!s.resIn || undefined} />
            <span>on main, fast-forwarded</span>
          </div>
        </Collapse>
      </Window>

      <Window title="homelab · T3 Code" className="hf-host" data-in={s.host || undefined}>
        <div className="hf-host__body">
          <div className="hf-thread">Add retry logic to the uploader</div>
          <div className="hf-branch">handoff/retry-uploader</div>
          <div className="hf-from">
            <Chip kind="job" data-target="job-to" data-hidden={!s.jobIn || undefined} />
          </div>
          <ul className="hf-steps">
            {HOST_STEPS.map((label, i) => (
              <li key={label} data-on={s.jobIn || undefined} style={{ ['--i' as string]: i }}>
                <Check on={s.work > i} pending={s.jobIn && s.work === i} size={14} />
                <span>{label}</span>
              </li>
            ))}
          </ul>
          {/* The diff the agent produced: filler at the edge, real words stay above */}
          <div className="hf-diff" data-on={s.work >= 2 || undefined}>
            {DIFF.map(([kind, w], i) => (
              <div key={i} className="hf-diff__line" data-kind={kind} style={{ ['--i' as string]: i }}>
                <span className="hf-diff__sign">{kind === 'add' ? '+' : kind === 'del' ? '−' : ''}</span>
                <Bar w={w} h={6} tone={kind === 'ctx' ? 2 : 3} />
              </div>
            ))}
          </div>
          <div className="hf-out">
            <Chip kind="result" data-target="res-from" data-hidden={!s.resReady || s.resGo || s.resIn || undefined} />
          </div>
        </div>
      </Window>

      <div className="hf-note" data-in={s.note || undefined}>the relay only ever sees ciphertext</div>

      {!s.jobIn && (
        <Fly from={rect('job-from')} to={rect('job-to')} go={s.jobGo} duration={820}>
          <Chip kind="job" />
        </Fly>
      )}
      {!s.resIn && (
        <Fly from={rect('res-from')} to={rect('res-to')} go={s.resGo} duration={820}>
          <Chip kind="result" />
        </Fly>
      )}
    </>
  )
}

export default function HandoffDemo() {
  const [run, setRun] = useState(0)
  return (
    <figure className="hf-figure">
      <Stage<S>
        key={run}
        width={820}
        height={420}
        compact={{ below: 640, width: 358, height: 540 }}
        initial={initial}
        poster={POSTER}
        play="once"
        script={script}
        keys="bottom-left"
        className="hf"
      >
        {(s, rect, layout) => <Scene s={s} rect={rect} layout={layout} />}
      </Stage>
      <figcaption>
        <span>One command on the laptop. The homelab does the work. The commits come back.</span>
        <button type="button" onClick={() => setRun((n) => n + 1)}>
          Replay
        </button>
      </figcaption>
    </figure>
  )
}
