
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { StudentReportCard } from './StudentReportCard';
import { ReceiptTemplate } from './ReceiptTemplate';

export const generateReceiptPDFBase64 = async (receipt: any, student: any, schoolName: string = 'مدرسة الإبداع والتميز', schoolLogo: string = ''): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '1000px';
      document.body.appendChild(container);

      const root = createRoot(container);
      root.render(<ReceiptTemplate receipt={receipt} student={student} schoolName={schoolName} schoolLogo={schoolLogo} />);

      setTimeout(async () => {
        try {
          const element = container.firstChild as HTMLElement;
          const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
          const imgData = canvas.toDataURL('image/jpeg', 0.7);
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          const base64 = pdf.output('datauristring');
          
          root.unmount();
          document.body.removeChild(container);
          resolve(base64);
        } catch (err) {
          reject(err);
        }
      }, 500);
    } catch (err) {
      reject(err);
    }
  });
};

export const generateStudentPDFBase64 = async (
  student: any,
  resultsMap: Record<string, string>,
  subjects: string[],
  examType: string,
  totalScore?: number,
  rank?: number,
  schoolName: string = 'مدرسة الإبداع والتميز',
  schoolLogo: string = '',
  academicYear: string = '2024 - 2025'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a hidden container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '1000px';
      document.body.appendChild(container);

      const root = createRoot(container);
      
      // Render the component
      root.render(
        <StudentReportCard 
          student={student}
          results={resultsMap}
          subjects={subjects}
          examType={examType}
          totalScore={totalScore}
          rank={rank}
          schoolName={schoolName}
          schoolLogo={schoolLogo}
          academicYear={academicYear}
        />
      );

      // Wait for React to render and fonts to load
      setTimeout(async () => {
        try {
          const element = container.firstChild as HTMLElement;
          const canvas = await html2canvas(element, { 
            scale: 2, 
            useCORS: true,
            logging: false
          });
          
          const imgData = canvas.toDataURL('image/jpeg', 0.7);
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          const base64 = pdf.output('datauristring');
          
          // Cleanup
          root.unmount();
          document.body.removeChild(container);
          
          resolve(base64);
        } catch (err) {
          console.error('Error generating PDF:', err);
          reject(err);
        }
      }, 500); // 500ms delay to ensure rendering is complete
    } catch (err) {
      reject(err);
    }
  });
};
