from pathlib import Path
root=Path(__file__).resolve().parents[2]
p=root/'assets/home-device-motion.js'
s=p.read_text(encoding='utf8')
assert s.count('flood-color="#269DFF"')==1
# Replace only the halo color, preserving the rest of the module byte for byte.
raw=p.read_bytes().replace(b'flood-color="#269DFF"',b'flood-color="#8FB5C4"')
p.write_bytes(raw)
qa=root/'outputs/qa'
check=(qa/'verify-device-blue.cjs').read_text(encoding='utf8')
check=check.replace('device-blue-','device-ice-').replace('rgb(72, 207, 255)','rgb(169, 204, 216)').replace('rgb(161, 234, 255)','rgb(216, 235, 241)')
check=check.split("\n if(process.argv[2]==='after'){\n  const page=await browser.newPage")[0]
check+='\n } finally { await browser.close(); }\n console.log("Ice lighting checked on 360, 390 and 430px; geometry, timing and motion unchanged.");\n})().catch(e=>{console.error(e);process.exitCode=1;});\n'
(qa/'verify-device-ice.cjs').write_text(check,encoding='utf8')
pixels=(qa/'check-device-blue-pixels.py').read_text(encoding='utf8').replace('device-blue-','device-ice-')
(qa/'check-device-ice-pixels.py').write_text(pixels,encoding='utf8')
package=(qa/'verify-device-lighting-package.cjs').read_text(encoding='utf8').replace('rgb(72, 207, 255)','rgb(169, 204, 216)').replace('rgb(161, 234, 255)','rgb(216, 235, 241)').replace('blue core and pulse','ice core and pulse')
(qa/'verify-device-ice-package.cjs').write_text(package,encoding='utf8')
before=(qa/'device-ice-before/home-device-motion.js').read_bytes()
assert raw==before.replace(b'flood-color="#269DFF"',b'flood-color="#8FB5C4"')
before=(qa/'device-ice-before/app.css').read_text(encoding='utf8')
expected=before.replace('#48cfff','#a9ccd8').replace('#a1eaff','#d8ebf1').replace('.craft-halo-layer{opacity:.28;','.craft-halo-layer{opacity:.10;')
assert (root/'assets/app.css').read_text(encoding='utf8')==expected
print('Only three light colors and halo opacity changed; module geometry and animation code unchanged.')
