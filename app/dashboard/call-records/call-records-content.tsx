"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  ArrowLeft,
  RefreshCw,
  Search,
  PhoneOff,
} from "lucide-react";
import Link from "next/link";
import CallDetailModal from "@/components/call-detail-modal";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDuration, getStatusBadge } from "@/lib/utils";
import type { CallRecord } from "@/types/interfaces";
import xlsx from "json-as-xlsx";
import { useDebounce } from "@/components/utils";

interface CallRecordsContentProps {
  initialCallRecords: CallRecord[];
}

export function CallRecordsContent({
  initialCallRecords,
}: CallRecordsContentProps) {
  const [filteredRecords, setFilteredRecords] =
    useState<CallRecord[]>(initialCallRecords);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  useEffect(() => {
    if (debouncedSearchTerm) {
      setFilteredRecords(
        initialCallRecords.filter(
          (record) =>
            record.customer?.number?.includes(debouncedSearchTerm) ||
            record.customer?.name
              ?.toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase()) ||
            record.phoneNumber?.twilioPhoneNumber?.includes(debouncedSearchTerm)
        )
      );
    } else {
      setFilteredRecords(initialCallRecords);
    }
  }, [debouncedSearchTerm, initialCallRecords]);

  const exportAsCSV = () => {
    const data = [
      {
        sheet: "Call Records",
        columns: [
          { label: "Caller ID", value: "id" },
          { label: "Name", value: "name" },
          { label: "Phone Number", value: "number" },
          { label: "Via", value: "twilioPhoneNumber" },
          { label: "Started At", value: "startedAt" },
          { label: "Ended At", value: "endedAt" },
          { label: "Duration", value: "duration" },
          { label: "Call Summary", value: "summary" },
        ],
        content: filteredRecords.map((record) => ({
          id: record.id,
          name: record.customer?.name || "Unknown",
          number: record.customer?.number || "N/A",
          twilioPhoneNumber: record.phoneNumber?.twilioPhoneNumber || "N/A",
          startedAt: formatDate(record.startedAt || record.createdAt),
          endedAt: formatDate(record.endedAt || ""),
          duration: formatDuration(
            record.startedAt || "",
            record.endedAt || ""
          ),
          summary: record.analysis?.summary || "",
        })),
      },
    ];

    const settings = {
      fileName: "CallRecords",
      extraLength: 3,
      writeMode: "writeFile",
      writeOptions: {},
      RTL: false,
    };

    xlsx(data, settings);
  };

  const handleCardClick = (call: CallRecord) => {
    setSelectedCall(call);
  };

  const closeModal = () => {
    setSelectedCall(null);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <Button
          variant="outline"
          onClick={exportAsCSV}
          className="w-full sm:w-auto"
        >
          Export as CSV
        </Button>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, number or Twilio number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        <Button variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2`} />
          Refresh
        </Button>
        <Link href="/" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
          <Search className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No call records found</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            {searchTerm
              ? "No records match your search criteria. Try a different search term."
              : "No call records available. Initiate calls to see records here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((call) => (
            <Card
              key={call.id}
              className="transition-all hover:shadow-lg hover:border-primary/30 cursor-pointer group"
              onClick={() => handleCardClick(call)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <CardTitle className="text-lg line-clamp-1">
                      {call.customer?.name || "Unknown Caller"}
                    </CardTitle>
                    <CardDescription className="line-clamp-1">
                      {call.customer?.number || "N/A"}
                    </CardDescription>
                    <CardDescription className="line-clamp-1 text-xs mt-1">
                      Via: {call.phoneNumber?.twilioPhoneNumber || "N/A"}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      getStatusBadge(
                        call?.status || "",
                        call?.endedReason || ""
                      ).color
                    }
                  >
                    {
                      getStatusBadge(
                        call?.status || "",
                        call?.endedReason || ""
                      ).text
                    }
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">
                      {formatDate(call.startedAt || call.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">
                      Duration:{" "}
                      {formatDuration(call.startedAt || "", call.endedAt || "")}
                    </span>
                  </div>
                  {call.endedReason === "customer-did-not-answer" && (
                    <div className="flex items-center text-orange-600">
                      <PhoneOff className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">Customer did not answer</span>
                    </div>
                  )}
                  {call.analysis?.summary && (
                    <div className="pt-2 border-t mt-2">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {call.analysis?.summary}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedCall && (
        <CallDetailModal call={selectedCall} onClose={closeModal} />
      )}
    </>
  );
}
