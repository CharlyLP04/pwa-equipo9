import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { createSyntheticPhotoEvidence, captureWithFallback, stopMediaStream } from '../../src/lib/device/camera';
import { SYNTHETIC_CAMPUS_LABS, matchLaboratoryFromCoordinates, getSyntheticLaboratoryLocation, getLocationWithFallback } from '../../src/lib/device/geolocation';
import { epoch } from '../helpers/fixture';
async function main() {
    mock.timers.enable({ apis: ['Date'], now: epoch });
    try {
        for (const lab of SYNTHETIC_CAMPUS_LABS) {
            assert.equal(matchLaboratoryFromCoordinates(lab), lab.name);
            const geo = getSyntheticLaboratoryLocation(lab.name);
            assert.equal(geo.laboratoryTag, lab.name);
            assert.equal(geo.coords?.latitude, lab.latitude);
        }
        assert.equal(getSyntheticLaboratoryLocation('unknown').laboratoryTag, SYNTHETIC_CAMPUS_LABS[0].name);
        const photo = createSyntheticPhotoEvidence('synthetic-08');
        assert.deepEqual(photo, createSyntheticPhotoEvidence('synthetic-08'));
        assert.equal(photo.width, 320);
        assert.equal(photo.height, 240);
        assert.equal(photo.fallbackUsed, true);
        assert.match(Buffer.from(photo.photoDataUri!.split(',')[1], 'base64').toString(), /synthetic-08/);
        assert.equal((await captureWithFallback()).fallbackReason, 'not_supported');
        assert.equal((await captureWithFallback({ allowSyntheticFallback: false })).success, false);
        assert.equal((await getLocationWithFallback()).success, true);
        assert.equal((await getLocationWithFallback(undefined, { allowManualFallback: false })).success, false);
        let stopped = 0;
        stopMediaStream({ getTracks: () => [{ stop: () => stopped++ }, { stop: () => stopped++ }] } as unknown as MediaStream);
        assert.equal(stopped, 2);
    }
    finally {
        mock.timers.reset();
    }
    console.log('device-helpers: reloj fijo, ubicación y fallback sin hardware PASS');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
