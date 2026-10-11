export type TrackEvent = 'view' | 'parsed' | 'calculated' | 'sample' | 'switch'

// Chunk 4 fills this in; until then nothing leaves the browser.
export function track(_event: TrackEvent, _extra?: { answer?: string }): void {}
