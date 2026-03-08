import json
import argparse
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Verify disease_info and class mapping consistency")
    parser.add_argument("--base", default=".", help="Base directory containing json files")
    parser.add_argument("--expected-num-classes", type=int, default=None, help="Model output class count for strict check")
    args = parser.parse_args()

    base = Path(args.base)
    disease = json.loads((base / "disease_info.json").read_text(encoding="utf-8"))
    class_to_idx = json.loads((base / "class_to_idx.json").read_text(encoding="utf-8"))
    idx_to_class = json.loads((base / "idx_to_class.json").read_text(encoding="utf-8"))

    disease_keys = set(disease.keys())
    map_keys = set(class_to_idx.keys())

    missing_in_disease = sorted(map_keys - disease_keys)
    missing_in_mapping = sorted(disease_keys - map_keys)

    contiguous_ok = sorted(class_to_idx.values()) == list(range(len(class_to_idx)))
    inverse_ok = all(idx_to_class.get(str(v)) == k for k, v in class_to_idx.items())

    print(f"Total disease_info keys: {len(disease_keys)}")
    print(f"Total class_to_idx keys: {len(map_keys)}")
    print(f"Contiguous idx check: {'PASS' if contiguous_ok else 'FAIL'}")
    print(f"Inverse mapping check: {'PASS' if inverse_ok else 'FAIL'}")

    if missing_in_disease:
        print("Missing in disease_info:", missing_in_disease)
    if missing_in_mapping:
        print("Missing in class_to_idx:", missing_in_mapping)

    if args.expected_num_classes is not None:
        dim_ok = args.expected_num_classes == len(class_to_idx)
        print(f"Model output class count check ({args.expected_num_classes}): {'PASS' if dim_ok else 'FAIL'}")
        if not dim_ok:
            raise SystemExit(2)

    if missing_in_disease or missing_in_mapping or (not contiguous_ok) or (not inverse_ok):
        raise SystemExit(1)

    print("All checks passed")


if __name__ == "__main__":
    main()
