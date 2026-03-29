import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Tesseract from "tesseract.js";
import { Plus, Upload, Loader2, DollarSign, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Mock Data
const mockExpenses = [
  { id: "EXP-101", title: "Client Dinner", category: "Food", amount: 124.50, currency: "USD", status: "APPROVED", date: "2026-03-24" },
  { id: "EXP-102", title: "Flight to NYC", category: "Travel", amount: 450.00, currency: "USD", status: "PENDING", date: "2026-03-26" },
  { id: "EXP-103", title: "Mouse Replacement", category: "Equipment", amount: 89.99, currency: "USD", status: "REJECTED", date: "2026-03-20" },
  { id: "EXP-104", title: "Uber to Airport", category: "Travel", amount: 45.20, currency: "USD", status: "PENDING", date: "2026-03-26" },
];

const CURRENCIES = [
  { code: "USD", symbol: "$", rateToUsd: 1, flag: "🇺🇸" },
  { code: "EUR", symbol: "€", rateToUsd: 1.08, flag: "🇪🇺" },
  { code: "GBP", symbol: "£", rateToUsd: 1.25, flag: "🇬🇧" },
  { code: "INR", symbol: "₹", rateToUsd: 0.012, flag: "🇮🇳" },
  { code: "JPY", symbol: "¥", rateToUsd: 0.0067, flag: "🇯🇵" },
];

const schema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.string().min(1),
  amount: z.coerce.number().positive(),
  currency: z.string().min(2),
});

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState(mockExpenses);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // OCR State
  const fileInputRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [receiptImage, setReceiptImage] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { currency: "USD", category: "Travel" }
  });

  const watchAmount = watch("amount");
  const watchCurrency = watch("currency");

  const getUSDEquivalent = () => {
    if (!watchAmount || isNaN(watchAmount)) return 0;
    const curr = CURRENCIES.find(c => c.code === watchCurrency);
    if (!curr) return watchAmount;
    return (watchAmount * curr.rateToUsd).toFixed(2);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setReceiptImage(URL.createObjectURL(file));
    setScanning(true);
    setScanProgress(0);

    try {
      const worker = await Tesseract.createWorker({
        logger: m => {
          if (m.status === 'recognizing text') {
            setScanProgress(parseInt(m.progress * 100));
          }
        }
      });
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      // Simple heuristic to find Total or Amount in OCR text for hackathon demo
      const totalMatch = text.match(/(?:total|amount|sum)[\s:$]*([\d,]+\.\d{2})/i);
      if (totalMatch && totalMatch[1]) {
        setValue("amount", parseFloat(totalMatch[1].replace(',', '')));
        toast({ title: "Receipt Scanned!", description: `Found amount: ${totalMatch[1]}` });
        
        // Try to guess a simple title
        const words = text.split('\n').filter(w => w.trim().length > 3);
        if (words.length > 0) {
          setValue("title", words[0].substring(0, 30));
        }
      } else {
        toast({ variant: "destructive", title: "Scan Incomplete", description: "Could not auto-detect the total amount." });
      }

    } catch (error) {
      toast({ variant: "destructive", title: "Scan Failed", description: "Failed to process the receipt image." });
    } finally {
      setScanning(false);
    }
  };

  const onSubmit = async (data) => {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1000));
    const newExp = {
      id: `EXP-${100 + expenses.length + 1}`,
      title: data.title,
      category: data.category,
      amount: data.amount,
      currency: data.currency,
      status: "PENDING",
      date: new Date().toISOString().split('T')[0]
    };
    setExpenses([newExp, ...expenses]);
    toast({ title: "Expense Submitted", description: "Your expense has been added to the approval queue." });
    setSheetOpen(false);
    reset();
    setReceiptImage(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">My Expenses</h1>
          <p className="text-white/50">Manage and submit your reimbursement requests.</p>
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Plus className="w-4 h-4 mr-2" />
              New Expense
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-xl glass-panel border-l border-white/10 overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-2xl font-bold text-white">Submit Expense</SheetTitle>
              <SheetDescription className="text-white/50">
                Upload a receipt to auto-fill details, or manually enter them below.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6">
              {/* Receipt Upload Area */}
              <div 
                className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center relative cursor-pointer hover:border-primary/50 hover:bg-white/5 transition-all text-center group"
                onClick={() => !scanning && fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload}
                  disabled={scanning}
                />
                
                {scanning ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-white/80 font-medium">Scanning Receipt... {scanProgress}%</span>
                    <div className="w-48 h-1.5 bg-black/40 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-primary transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                    </div>
                  </div>
                ) : receiptImage ? (
                  <div className="flex flex-col items-center">
                    <img src={receiptImage} alt="Receipt preview" className="h-32 object-contain rounded-md shadow-lg border border-white/10 mb-4" />
                    <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-none">
                      <RefreshCcw className="w-4 h-4 mr-2" /> Replace Receipt
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-white font-medium mb-1">Click to upload receipt</span>
                    <span className="text-sm text-white/40">Smart OCR will auto-fill amount</span>
                  </>
                )}
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-12">
                <div className="flex flex-col gap-2">
                  <Label className="text-white/80">Title / Merchant</Label>
                  <Input {...register("title")} placeholder="e.g. Uber, Delta Airlines" className="bg-black/20 border-white/10 text-white" />
                  {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-white/80">Category</Label>
                    <Select onValueChange={(val) => setValue("category", val)} defaultValue="Travel">
                      <SelectTrigger className="bg-black/20 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass border-white/10 text-white">
                        <SelectItem value="Travel">✈️ Travel</SelectItem>
                        <SelectItem value="Food">🍔 Meals & Ent</SelectItem>
                        <SelectItem value="Equipment">💻 Equipment</SelectItem>
                        <SelectItem value="Software">📦 Software</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col gap-2 relative group">
                    <Label className="text-white/80">Currency</Label>
                    <Select onValueChange={(val) => setValue("currency", val)} defaultValue="USD">
                      <SelectTrigger className="bg-black/20 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass border-white/10 text-white">
                        {CURRENCIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>
                            <div className="flex items-center gap-2">
                              <span>{c.flag}</span>
                              <span>{c.code}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-white/80">Amount</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/40">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...register("amount")} 
                      className="bg-black/20 border-white/10 text-white pl-9 text-lg font-bold" 
                      placeholder="0.00" 
                    />
                  </div>
                  {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
                  
                  {watchAmount > 0 && watchCurrency !== "USD" && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 flex items-center gap-2"
                    >
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                        ≈ {getUSDEquivalent()} USD
                      </Badge>
                      <span className="text-xs text-white/40">Live FX Rate applied</span>
                    </motion.div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-white/80">Description (Optional)</Label>
                  <Textarea {...register("description")} className="bg-black/20 border-white/10 text-white h-24" placeholder="Business purpose..." />
                </div>

                <div className="pt-4 mt-8 border-t border-white/10 flex justify-end gap-3 w-full">
                  <Button type="button" variant="ghost" className="text-white/70 hover:text-white" onClick={() => setSheetOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || scanning} className="bg-primary hover:bg-primary/90">
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Submit Expense
                  </Button>
                </div>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border-white/5 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/50 uppercase tracking-wider">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white tracking-tight">$495.20</div>
            <p className="text-xs text-yellow-500/80 mt-1 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block animate-pulse"></span> 2 actions needed
            </p>
          </CardContent>
        </Card>
        <Card className="glass border-white/5 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/50 uppercase tracking-wider">Approved this month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary tracking-tight">$1,240.00</div>
          </CardContent>
        </Card>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white">Recent Submissions</h2>
        </div>
        <Table>
          <TableHeader className="bg-white/5 border-b border-white/5">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-white/60 font-medium py-4">Title</TableHead>
              <TableHead className="text-white/60 font-medium py-4">Category</TableHead>
              <TableHead className="text-white/60 font-medium py-4">Amount</TableHead>
              <TableHead className="text-white/60 font-medium py-4">Date</TableHead>
              <TableHead className="text-white/60 font-medium py-4 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id} className="border-white/5 hover:bg-white/5 transition-colors group cursor-pointer">
                <TableCell className="font-medium text-white py-4">
                  <div>{expense.title}</div>
                  <div className="text-xs text-white/40">{expense.id}</div>
                </TableCell>
                <TableCell className="py-4">
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70">
                    {expense.category}
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  <div className="font-medium text-white">
                    {expense.currency === 'USD' ? '$' : expense.currency === 'EUR' ? '€' : expense.currency === 'GBP' ? '£' : ''}
                    {expense.amount.toFixed(2)}
                  </div>
                  {expense.currency !== 'USD' && (
                    <div className="text-xs text-white/40">{expense.currency}</div>
                  )}
                </TableCell>
                <TableCell className="py-4 text-white/70">
                  {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </TableCell>
                <TableCell className="py-4 text-right">
                  <Badge className={
                    expense.status === 'APPROVED' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' :
                    expense.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                    'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                  }>
                    {expense.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
