# Data, model, and image attribution

This file records third-party material used or referenced by RADIOTOMY. The repository does not currently declare a single license for its original software. Third-party materials retain their own terms; do not assume this file licenses the application or clears every use.

## 3D anatomy models

### Male model: BodyParts3D and Z-Anatomy

`models/body.glb` is a locally generated derivative and is not included in this repository. Project notes describe it as separate BodyParts3D meshes converted to binary glTF, with coordinates converted from Z-up to glTF Y-up, plus five supplemental lung-lobe meshes from Z-Anatomy. Changes include format conversion and alignment/scaling of the supplemental meshes.

The local source archive currently present during preparation is `models/bodyparts3d_isa_obj.zip`; its contents are under `isa_BP3D_4.0_obj_99/`, and the downloaded OBJ headers state Creative Commons Attribution-ShareAlike 2.1 Japan. The current [BodyParts3D license page](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), updated 2025-02-27, states CC BY 4.0 for the database and asks for this credit:

> BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International

The archive's per-file headers and the current database license page name different license versions. Confirm which terms apply to the specific archived meshes before redistributing the archive or derived model. The [BodyParts3D download page](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html) lists the ISA and PART-OF archives separately.

The supplemental five lung meshes came from `VisceralSystem100.fbx` in [Z-Anatomy's PC-Version repository](https://github.com/LluisV/Z-Anatomy/tree/PC-Version/Resources/Models/FBX), licensed CC BY-SA 4.0. The project requests this credit:

> Z-Anatomy - The libre 3D atlas of anatomy - CC-BY-SA 4.0

The resulting model combines materials with different source histories. Preserve both credits, identify modifications, and review the applicable ShareAlike terms before distributing a derivative.

### Female model: HuBMAP / Human Reference Atlas

The app loads the [3D Reference Organ Set for Female v1.5](https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb) directly from the HuBMAP CDN. Dataset DOI: [10.48539/HBM352.BTSQ.586](https://doi.org/10.48539/HBM352.BTSQ.586). The dataset is identified as CC BY 4.0. Credit Kristen Browne and Heidi Schlehlein, HuBMAP Consortium / Human Reference Atlas, and link [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

This model is fetched at runtime and is not bundled in the repository.

## Visible Human images

Selected PNG samples are fetched from the U.S. National Library of Medicine's [Visible Human Project](https://www.nlm.nih.gov/research/visible/visible_human.html), not stored in this repository. NLM describes the datasets as public-domain data and states that a license is no longer required to access them as of 2019. Credit the U.S. National Library of Medicine, Visible Human Project, and do not imply NLM endorsement.

## Positioning images

The source, credit, license, and modifications for the locally stored positioning images are recorded in `positioning-images.json`. Summary:

The copies under `assets/positioning/` for supine and both decubitus views are byte-identical duplicates of the corresponding files under `static/images/positioning/`; the active image manifest points to the `static/` copies.

| Image | Source / credit | License | Changes |
|---|---|---|---|
| `static/images/positioning/chest-pa-erect.jpg` | Ptrump16, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Chest_X-ray.jpg) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Resized; not cropped |
| `static/images/positioning/chest-lateral-erect.png` | Brent Burbridge, *Undergraduate Diagnostic Imaging Fundamentals*, [Fig. 5.3B](https://www.saskoer.ca/undergradimaging/chapter/approach-to-the-chest-x-ray-cxr/) | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), except where noted | Saved from source; not cropped |
| `static/images/positioning/chest-ap-erect.jpg` | James Heilman, MD, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Normal_AP.JPG) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | Resized; not cropped |
| `static/images/positioning/chest-ap-supine.webp` | Zhang et al., *Critical Care* 2006, [Figure 2(a)](https://pmc.ncbi.nlm.nih.gov/articles/PMC1751015/) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | Cropped to panel (a) |
| `static/images/positioning/chest-decubitus-left.webp` and `chest-decubitus-right.webp` | Newby et al., [Cureus 2020](https://doi.org/10.7759/cureus.8161), Figure 1A and 1B | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Cropped to panels; labels retained |
| `assets/positioning/chest-ap-lordotic.webp` | Ian Bickle, [Radiopaedia: Normal chest imaging examples](https://radiopaedia.org/articles/normal-chest-imaging-examples) | Identified in project metadata as [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) | Converted from JPEG to WebP; no crop or resize |

**Lordotic image source record is incomplete:** `positioning-images.json` has `source: null` and `sourcePending: true`. The Radiopaedia article identifies the example as a lordotic view, but the direct image/source URL still needs to be recorded. Do not treat the current credit as a complete source record.

The lateral and lordotic images carry NonCommercial terms. They cannot be used for commercial purposes under those licenses. ShareAlike terms also apply to adaptations of those images.
