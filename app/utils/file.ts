export const validExtensions = {
  image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"],
  pdf: [".pdf"],
  excel: [".xls", ".xlsx"],
  ppt: [".ppt", ".pptx"],
  word: [".doc", ".docx"],
  text: [".txt", ".md", ".markdown"],
};

export const getFinalFileType = (fileType: string) => {
  const formatFileType = fileType.toLowerCase();
  if (validExtensions.excel.some((excelExt) => formatFileType === excelExt)) {
    return "excel";
  }
  if (validExtensions.word.some((wordExt) => formatFileType === wordExt)) {
    return "text";
  }
  if (validExtensions.text.some((textExt) => formatFileType === textExt)) {
    return "text";
  }
  return fileType;
};

export const allValidExtensions = Object.values(validExtensions)
  .flat()
  .map((ext) => ext.replace(/^\./, ""));

export const isImage = (ext: string) => {
  const formatExt = `.${ext.toLowerCase()}`;
  return validExtensions.image.some((imageExt) => formatExt === imageExt);
};
export const isPdf = (ext: string) => {
  const formatExt = `.${ext.toLowerCase()}`;
  return validExtensions.pdf.some((pdfExt) => formatExt === pdfExt);
};
