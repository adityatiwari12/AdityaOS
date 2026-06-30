import fitz

doc = fitz.open(r"D:\portfolio\Aditya_Tiwari_CV_Masters.pdf")
text = "\n".join(page.get_text() for page in doc)

with open(r"D:\portfolio\util\cv_text.txt", "w", encoding="utf-8") as f:
    f.write(text)

print("wrote", len(text), "chars")
