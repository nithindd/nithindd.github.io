const localHint = (state) => {
    switch (state.questStage) {
        case 'meet-miri':
            return { text: `${state.bakerName} keeps looking toward the silent fountain. I think she needs our help.`, emotion: 'curious', source: 'local' };
        case 'collect-moonberries':
            return state.location === 'forest'
                ? { text: `Moonberries glow softly near old roots. Stay close—we still need ${Math.max(0, 3 - state.moonberries)}.`, emotion: 'hint', source: 'local' }
                : { text: 'The forest path is calling. I can feel Moonberry magic from there.', emotion: 'curious', source: 'local' };
        case 'return-to-miri':
            return { text: `We found all three! Let’s bring them back to ${state.bakerName} and see whether the fountain remembers.`, emotion: 'happy', source: 'local' };
        case 'restored':
            return { text: `Listen, ${state.playerName}—the fountain is singing. This place remembered our kindness.`, emotion: 'wonder', source: 'local' };
    }
};
class HybridCompanionDirector {
    endpoint = ((import.meta.env?.VITE_COMPANION_API_URL)
        || window.ADIS_WONDERSTEPS_COMPANION_API_URL
        || window.WONDERWOOD_COMPANION_API_URL
        || '/api/companion').trim();
    remoteAvailable = null;
    async getHint(state) {
        if (this.remoteAvailable === false)
            return localHint(state);
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 2200);
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'hint', state }), signal: controller.signal
            });
            if (!response.ok)
                throw new Error(`AI endpoint ${response.status}`);
            const value = await response.json();
            const emotions = ['curious', 'happy', 'hint', 'wonder', 'surprised'];
            if (typeof value.text !== 'string' || value.text.length < 1 || value.text.length > 220 || !emotions.includes(value.emotion)) {
                throw new Error('Invalid AI response');
            }
            this.remoteAvailable = true;
            return { text: value.text, emotion: value.emotion, source: 'ai' };
        }
        catch {
            this.remoteAvailable = false;
            return localHint(state);
        }
        finally {
            window.clearTimeout(timer);
        }
    }
}
export const companionDirector = new HybridCompanionDirector();
//# sourceMappingURL=CompanionDirector.js.map