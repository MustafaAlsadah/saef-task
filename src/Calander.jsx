import React, { useState, useEffect } from "react";
import { db } from "./firebaseapp";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayRemove,
  collection,
  addDoc,
} from "firebase/firestore";

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [availableDays, setAvailableDays] = useState([]);
  const [slotsByDay, setSlotsByDay] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ name: "", phoneNumber: "" });
  const [showBookingForm, setShowBookingForm] = useState(false);

  const arabicMonths = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  const monthDocId = `${currentYear}-${currentMonth + 1}`;

  useEffect(() => {
    fetchMonthData();
  }, [currentMonth, currentYear]);

  const fetchMonthData = async () => {
    const docRef = doc(db, "months", monthDocId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Ensure `data.days` is an array
      const days = Array.isArray(data.days) ? data.days : [];

      setAvailableDays(days.map((day) => day.day));
      const slots = {};
      days.forEach((day) => {
        slots[day.day] = day.slots || [];
      });
      setSlotsByDay(slots);
    } else {
      setAvailableDays([]);
      setSlotsByDay({});
    }
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prevYear) => prevYear - 1);
    } else {
      setCurrentMonth((prevMonth) => prevMonth - 1);
    }
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prevYear) => prevYear + 1);
    } else {
      setCurrentMonth((prevMonth) => prevMonth + 1);
    }
    setSelectedDay(null);
  };

  const selectDay = (day) => {
    if (availableDays.includes(day)) {
      setSelectedDay(day === selectedDay ? null : day);
      setShowBookingForm(false);
    }
  };

  const selectSlot = (slot) => {
    setSelectedSlot(slot);
    setShowBookingForm(true);
  };

  const updateForm = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const bookSlot = async () => {
    if (!form.name || !form.phoneNumber) {
      alert("الرجاء إدخال الاسم ورقم الهاتف");
      return;
    }

    try {
      await addDoc(collection(db, "bookings"), {
        year: currentYear,
        month: currentMonth + 1,
        day: selectedDay,
        slot: selectedSlot,
        name: form.name,
        phoneNumber: form.phoneNumber,
        timestamp: new Date(),
      });

      const monthRef = doc(db, "months", monthDocId);
      const monthSnap = await getDoc(monthRef);

      if (monthSnap.exists()) {
        const monthData = monthSnap.data();
        const days = Array.isArray(monthData.days) ? monthData.days : [];

        const updatedDays = days.map((day) => {
          if (day.day === selectedDay) {
            return {
              ...day,
              slots: day.slots.filter((slot) => slot !== selectedSlot),
            };
          }
          return day;
        });

        await updateDoc(monthRef, { days: updatedDays });

        setSlotsByDay((prevSlots) => {
          const updatedSlots = { ...prevSlots };
          updatedSlots[selectedDay] = updatedSlots[selectedDay].filter(
            (slot) => slot !== selectedSlot
          );

          if (updatedSlots[selectedDay].length === 0) {
            setAvailableDays((prevDays) =>
              prevDays.filter((day) => day !== selectedDay)
            );
            setSelectedDay(null);
          }

          return updatedSlots;
        });

        alert(`تم حجز الموعد: ${selectedSlot} بنجاح!`);
      } else {
        console.error("Month document does not exist.");
      }

      setForm({ name: "", phoneNumber: "" });
      setShowBookingForm(false);
      setSelectedSlot(null);
    } catch (error) {
      console.error("Error booking slot:", error);
      alert("حدث خطأ أثناء الحجز. الرجاء المحاولة مرة أخرى.");
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div
      className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md"
      dir="rtl"
    >
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={goToPreviousMonth}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-4 py-2"
        >
          &larr; الشهر السابق
        </button>
        <h2 className="text-xl font-bold text-gray-800">
          {arabicMonths[currentMonth]} {currentYear}
        </h2>
        <button
          onClick={goToNextMonth}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-4 py-2"
        >
          الشهر التالي &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-4 text-center">
        {[
          "الأحد",
          "الإثنين",
          "الثلاثاء",
          "الأربعاء",
          "الخميس",
          "الجمعة",
          "السبت",
        ].map((day) => (
          <div key={day} className="text-sm font-semibold text-gray-600">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const hasSlots = slotsByDay[day] && slotsByDay[day].length > 0;
          const isAvailable = availableDays.includes(day) && hasSlots;

          return (
            <div
              key={day}
              onClick={() => isAvailable && selectDay(day)}
              className={`cursor-pointer p-4 rounded-lg text-white font-semibold ${
                isAvailable
                  ? selectedDay === day
                    ? "bg-green-300 text-green-900"
                    : "bg-green-200 text-green-900 hover:bg-green-300"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {selectedDay && slotsByDay[selectedDay]?.length > 0 && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            المواعيد المتاحة ليوم {selectedDay}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {slotsByDay[selectedDay].map((slot) => (
              <button
                key={slot}
                onClick={() => selectSlot(slot)}
                className="p-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600"
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {showBookingForm && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            إدخال بيانات الحجز
          </h3>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              name="name"
              placeholder="الاسم"
              value={form.name}
              onChange={updateForm}
              className="p-2 border rounded-lg"
            />
            <input
              type="text"
              name="phoneNumber"
              placeholder="رقم الهاتف"
              value={form.phoneNumber}
              onChange={updateForm}
              className="p-2 border rounded-lg"
            />
            <button
              onClick={bookSlot}
              className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
            >
              تأكيد الحجز
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
